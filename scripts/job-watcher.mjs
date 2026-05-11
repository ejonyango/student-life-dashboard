import { createServer } from "node:http";
import { request as httpsRequest } from "node:https";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { URL } from "node:url";
import pg from "pg";

const localEnv = {};

if (existsSync(".env")) {
  const envFile = readFileSync(".env", "utf8");
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match) continue;
    localEnv[match[1]] = match[2].replace(/^["']|["']$/g, "");
    if (!process.env[match[1]]) {
      process.env[match[1]] = localEnv[match[1]];
    }
  }
}

const PORT = Number(process.env.JOB_WATCHER_PORT || 8787);
const MAX_RESULTS = 500;
const CACHE_DIR = ".cache/job-watcher";
const THEIRSTACK_CACHE_PATH = `${CACHE_DIR}/theirstack.json`;
const excludedTitlePatterns = [
  /\bvice president\b/i,
  /\bvp\b/i,
  /\bsvp\b/i,
  /\bavp\b/i,
  /\bchief\b/i,
  /\bcfo\b/i,
  /\bcontroller\b/i,
  /\bdirector\b/i,
  /\bhead of\b/i,
  /\bprincipal\b/i,
  /\bpartner\b/i,
  /\bsenior\b/i,
  /\bsr\.?\b/i,
  /\bmanager\b/i,
  /\blead\b/i,
  /\bstaff\b/i,
  /\bexperienced\b/i
];
const studentFriendlyPatterns = [
  /\bintern\b/i,
  /\binternship\b/i,
  /\bsummer analyst\b/i,
  /\banalyst intern\b/i,
  /\bearly career\b/i,
  /\bentry level\b/i,
  /\bgraduate\b/i,
  /\btrainee\b/i,
  /\bco-?op\b/i,
  /\bapprentice\b/i
];

const providerConfig = {
  theirStack: process.env.THEIRSTACK_API_KEY || "",
  serpApi: process.env.SERPAPI_API_KEY || "",
  rapidApiKey: process.env.RAPIDAPI_KEY || "",
  rapidApiAppId: process.env.RAPIDAPI_APP_ID || "",
  rapidApiJobsHost: process.env.RAPIDAPI_JOBS_HOST || "jsearch.p.rapidapi.com",
  deepSeekKey: localEnv.DEEPSEEK_API_KEY ?? process.env.DEEPSEEK_API_KEY ?? "",
  deepSeekBaseUrl: (localEnv.DEEPSEEK_BASE_URL || process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, ""),
  deepSeekFastModel: localEnv.DEEPSEEK_FAST_MODEL || process.env.DEEPSEEK_FAST_MODEL || "deepseek-v4-flash",
  deepSeekProModel: localEnv.DEEPSEEK_PRO_MODEL || process.env.DEEPSEEK_PRO_MODEL || "deepseek-v4-pro",
  deepSeekPacketRoute: localEnv.DEEPSEEK_PACKET_ROUTE || process.env.DEEPSEEK_PACKET_ROUTE || "fast",
  databaseUrl: localEnv.SUPABASE_DB_URL || process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || ""
};

let theirStackMemoryCache = null;
let dbPool = null;

function readTheirStackCache() {
  if (theirStackMemoryCache) return theirStackMemoryCache;
  if (!existsSync(THEIRSTACK_CACHE_PATH)) return null;

  try {
    theirStackMemoryCache = JSON.parse(readFileSync(THEIRSTACK_CACHE_PATH, "utf8"));
    return theirStackMemoryCache;
  } catch {
    return null;
  }
}

function writeTheirStackCache(result) {
  mkdirSync(CACHE_DIR, { recursive: true });
  theirStackMemoryCache = {
    cachedAt: new Date().toISOString(),
    result
  };
  writeFileSync(THEIRSTACK_CACHE_PATH, JSON.stringify(theirStackMemoryCache, null, 2));
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Content-Type": "application/json"
  });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function getDbPool() {
  if (!providerConfig.databaseUrl) return null;
  if (!dbPool) {
    const { Pool } = pg;
    dbPool = new Pool({
      connectionString: providerConfig.databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 3
    });
  }
  return dbPool;
}

function toDatabaseStatus(status = "Drafting") {
  const statuses = {
    Applied: "applied",
    Interview: "interview",
    Drafting: "drafting",
    "Follow-up": "follow_up",
    "Offer prep": "offer_prep"
  };
  return statuses[status] || "drafting";
}

function fromDatabaseStatus(status = "drafting") {
  const statuses = {
    applied: "Applied",
    interview: "Interview",
    drafting: "Drafting",
    follow_up: "Follow-up",
    offer_prep: "Offer prep"
  };
  return statuses[status] || "Drafting";
}

function mapApplicationRow(row) {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    status: fromDatabaseStatus(row.status),
    next: row.next_step || "",
    fit: Number(row.fit || 0),
    source: row.source || "",
    applicationLink: row.application_link || "",
    resumeVersion: row.resume_version || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    appliedAt: row.applied_at
  };
}

async function listApplicationRecords() {
  const pool = getDbPool();
  if (!pool) {
    return { ok: false, database: false, applications: [], reason: "database_not_configured" };
  }

  const result = await pool.query(
    `
      select
        applications.id,
        applications.company,
        applications.role,
        applications.status,
        applications.next_step,
        applications.fit,
        applications.source,
        applications.application_link,
        applications.created_at,
        applications.updated_at,
        applications.applied_at,
        coalesce(resume_versions.status || ' baseline', '') as resume_version
      from public.applications
      left join public.resume_versions on resume_versions.id = applications.resume_version_id
      join public.student_profiles on student_profiles.id = applications.student_id
      where student_profiles.slug = 'eric-onyango'
      order by applications.updated_at desc
    `
  );

  return {
    ok: true,
    database: true,
    applications: result.rows.map(mapApplicationRow)
  };
}

async function saveApplicationRecord(application) {
  const pool = getDbPool();
  if (!pool) {
    return { ok: false, saved: false, reason: "database_not_configured" };
  }

  const result = await pool.query(
    `
      with student as (
        select id from public.student_profiles where slug = 'eric-onyango' limit 1
      )
      insert into public.applications (
        student_id,
        company,
        role,
        status,
        next_step,
        fit,
        source,
        application_link,
        updated_at,
        applied_at
      )
      values (
        (select id from student),
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        now(),
        case when $3 = 'applied' then now() else null end
      )
      on conflict (student_id, company, role)
      do update set
        status = excluded.status,
        next_step = excluded.next_step,
        fit = excluded.fit,
        source = excluded.source,
        application_link = excluded.application_link,
        updated_at = now(),
        applied_at = case
          when excluded.status = 'applied' and public.applications.applied_at is null then now()
          else public.applications.applied_at
        end
      returning id, company, role, status, next_step, fit, source, application_link, created_at, updated_at, applied_at
    `,
    [
      application.company,
      application.role,
      toDatabaseStatus(application.status),
      application.next || "",
      Number(application.fit || 0),
      application.source || "",
      application.applicationLink || ""
    ]
  );

  return { ok: true, saved: true, application: result.rows[0] };
}

async function handleListApplications(response) {
  const result = await listApplicationRecords();
  sendJson(response, 200, result);
}

async function handleSaveApplication(request, response) {
  const body = await readBody(request);
  const application = body.application || body;

  if (!application.company || !application.role) {
    sendJson(response, 400, { ok: false, saved: false, error: "company and role are required" });
    return;
  }

  const result = await saveApplicationRecord(application);
  sendJson(response, 200, result);
}

function cleanHtml(value = "") {
  return String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value, fallback = "Unknown") {
  const cleaned = cleanHtml(value);
  return cleaned || fallback;
}

function sourceBoard(provider) {
  if (provider === "theirstack") return "TheirStack";
  if (provider === "serpapi") return "SerpApi";
  if (provider === "rapidapi") return "RapidAPI";
  return "Company Careers";
}

function splitTerms(value) {
  return String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 2);
}

function normalizeListing(raw, provider) {
  const title = raw.title || raw.job_title || raw.name || raw.position || "Internship";
  const company =
    raw.company?.display_name ||
    raw.company ||
    raw.company_name ||
    raw.company_object?.name ||
    raw.organization ||
    raw.employer_name ||
    "Unknown company";
  const location =
    raw.location?.display_name ||
    raw.location?.area?.join(", ") ||
    raw.location ||
    raw.job_location ||
    raw.locations_derived?.join(", ") ||
    raw.detected_extensions?.location ||
    raw.candidate_required_location ||
    "Location not listed";
  const description =
    raw.description ||
    raw.job_description ||
    raw.snippet ||
    raw.highlights?.join(" ") ||
    raw.extensions?.join(" ") ||
    "Live job posting imported from the configured job source.";
  const url =
    raw.final_url ||
    raw.url ||
    raw.redirect_url ||
    raw.apply_url ||
    raw.application_url ||
    raw.related_links?.[0]?.link ||
    raw.share_link ||
    raw.job_apply_link ||
    raw.apply_options?.[0]?.link ||
    raw.link ||
    "#";
  const date =
    raw.date_posted ||
    raw.posted_at ||
    raw.created_at ||
    raw.detected_extensions?.posted_at ||
    raw.posted_date ||
    new Date().toISOString();
  const textForTerms = `${title} ${company} ${location} ${description}`;
  const terms = Array.from(new Set(splitTerms(textForTerms))).slice(0, 18);

  return {
    company: compact(company),
    role: compact(title, "Internship"),
    location: compact(location, "Location not listed"),
    sourceBoard: sourceBoard(provider),
    sourceDescription: compact(description, "Live job posting imported from the configured job source.").slice(0, 360),
    companyVerification: url && url !== "#" ? "Live source link captured; company career-page verification pending." : "Live source found; application link needs review.",
    applicationLink: url,
    verifiedDate: new Date(date).toString() === "Invalid Date" ? compact(date) : new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }),
    skills: terms,
    experienceSignals: terms,
    majors: ["finance", "accounting", "economics", "information systems", "business"]
  };
}

function dedupe(listings) {
  const seen = new Set();
  return listings.filter((listing) => {
    const key = `${listing.company}|${listing.role}|${listing.location}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isStudentAppropriateListing(listing) {
  const role = listing.role || "";
  const combinedText = `${listing.role} ${listing.sourceDescription}`;
  const hasStudentSignal = studentFriendlyPatterns.some((pattern) => pattern.test(combinedText));
  const hasExcludedTitle = excludedTitlePatterns.some((pattern) => pattern.test(role));

  return hasStudentSignal && !hasExcludedTitle;
}

async function providerError(response, provider) {
  const text = await response.text();
  try {
    const payload = JSON.parse(text);
    return payload.error?.description || payload.error?.title || payload.message || `${provider} returned ${response.status}.`;
  } catch {
    return text ? `${provider} returned ${response.status}: ${text.slice(0, 180)}` : `${provider} returned ${response.status}.`;
  }
}

function postJsonWithTimeout(url, headers, payload, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const body = JSON.stringify(payload);
    const request = httpsRequest(
      {
        hostname: target.hostname,
        path: `${target.pathname}${target.search}`,
        method: "POST",
        headers: {
          ...headers,
          "Content-Length": Buffer.byteLength(body)
        },
        timeout: timeoutMs
      },
      (response) => {
        let responseBody = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          responseBody += chunk;
        });
        response.on("end", () => {
          resolve({
            ok: response.statusCode >= 200 && response.statusCode < 300,
            status: response.statusCode,
            text: responseBody,
            json: () => JSON.parse(responseBody)
          });
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(new Error(`Request timed out after ${timeoutMs / 1000} seconds.`));
    });
    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

async function fetchTheirStack(search) {
  if (!providerConfig.theirStack) {
    return { provider: "TheirStack", status: "missing_key", message: "Set THEIRSTACK_API_KEY to enable TheirStack.", listings: [] };
  }

  const cached = readTheirStackCache();
  if (cached?.result) {
    return {
      ...cached.result,
      message: `${cached.result.message} Cached from ${new Date(cached.cachedAt).toLocaleString("en-US")}; live TheirStack calls are limited to one.`
    };
  }

  const response = await fetch("https://api.theirstack.com/v1/jobs/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${providerConfig.theirStack}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      limit: 25,
      page: 0,
      posted_at_max_age_days: 30,
      job_country_code_or: ["US"],
      job_location_pattern_or: ["Chicago", "Remote"],
      job_title_or: search.titles,
      employment_statuses_or: ["internship"]
    })
  });

  if (!response.ok) {
    const result = { provider: "TheirStack", status: "error", message: await providerError(response, "TheirStack"), listings: [] };
    writeTheirStackCache(result);
    return result;
  }

  const payload = await response.json();
  const jobs = payload.data || payload.jobs || payload.results || [];
  const result = {
    provider: "TheirStack",
    status: "ok",
    message: `${jobs.length} jobs returned.`,
    listings: jobs.map((job) => normalizeListing(job, "theirstack"))
  };
  writeTheirStackCache(result);
  return result;
}

async function fetchSerpApi(search) {
  if (!providerConfig.serpApi) {
    return { provider: "SerpApi", status: "missing_key", message: "Set SERPAPI_API_KEY to enable Google Jobs discovery.", listings: [] };
  }

  const responses = await Promise.all(
    search.serpQueries.map(async (query) => {
      const params = new URLSearchParams({
        engine: "google_jobs",
        q: query,
        location: "Chicago, Illinois, United States",
        hl: "en",
        api_key: providerConfig.serpApi
      });
      const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);

      if (!response.ok) {
        throw new Error(await providerError(response, "SerpApi"));
      }

      const payload = await response.json();
      return payload.jobs_results || [];
    })
  );
  const jobs = responses.flat();

  return {
    provider: "SerpApi",
    status: "ok",
    message: `${jobs.length} jobs returned.`,
    listings: jobs.map((job) => normalizeListing(job, "serpapi"))
  };
}

async function fetchRapidApiJobs(search) {
  if (!providerConfig.rapidApiKey) {
    return { provider: "RapidAPI", status: "missing_key", message: "Set RAPIDAPI_KEY to enable RapidAPI JSearch.", listings: [] };
  }

  const params = new URLSearchParams({
    query: search.rapidApiQuery,
    page: "1",
    num_pages: "1",
    country: "us",
    date_posted: "month"
  });
  const response = await fetch(`https://${providerConfig.rapidApiJobsHost}/search-v2?${params.toString()}`, {
    headers: {
      "X-RapidAPI-Key": providerConfig.rapidApiKey,
      "X-RapidAPI-Host": providerConfig.rapidApiJobsHost
    }
  });

  if (!response.ok) {
    return { provider: "RapidAPI", status: "error", message: await providerError(response, "RapidAPI"), listings: [] };
  }

  const payload = await response.json();
  const jobs = payload.data?.jobs || payload.data || payload.results || payload.jobs || [];

  return {
    provider: "RapidAPI",
    status: "ok",
    message: `${jobs.length} jobs returned.`,
    listings: jobs.map((job) => normalizeListing(job, "rapidapi"))
  };
}

function buildSearch(body) {
  const terms = [
    ...(body.skills || []),
    ...(body.experience || []),
    ...(body.keywords || []),
    body.major || "finance"
  ]
    .map((term) => String(term).toLowerCase())
    .filter(Boolean);
  const priorityTerms = Array.from(new Set([
    "finance intern",
    "investment banking intern",
    "capital markets intern",
    "corporate finance intern",
    "treasury intern",
    ...terms.slice(0, 8)
  ]));

  return {
    query: priorityTerms.slice(0, 6).join(" "),
    serpQueries: [
      "finance intern Chicago",
      "investment banking summer analyst Chicago",
      "capital markets intern Chicago",
      "treasury intern Chicago"
    ],
    rapidApiQuery: "finance intern in Chicago",
    titles: [
      "finance intern",
      "investment banking intern",
      "capital markets intern",
      "corporate finance intern",
      "treasury intern",
      "summer analyst"
    ],
    descriptionTerms: priorityTerms
  };
}

async function handleJobSearch(request, response) {
  const body = await readBody(request);
  const search = buildSearch(body);
  const settled = await Promise.allSettled([
    fetchTheirStack(search),
    fetchSerpApi(search),
    fetchRapidApiJobs(search)
  ]);

  const providerResults = settled.map((result, index) => {
    if (result.status === "fulfilled") return result.value;
    return {
      provider: ["TheirStack", "SerpApi", "RapidAPI"][index],
      status: "error",
      message: result.reason?.message || "Provider request failed.",
      listings: []
    };
  });
  const listings = dedupe(providerResults.flatMap((result) => result.listings))
    .filter(isStudentAppropriateListing)
    .slice(0, MAX_RESULTS);

  sendJson(response, 200, {
    checkedAt: new Date().toISOString(),
    query: search.query,
    listings,
    providerStatus: providerResults.map((result) => ({
      provider: result.provider,
      status: result.status,
      message: result.message,
      count: result.listings.length
    }))
  });
}

function parseJsonBlock(value) {
  const text = String(value || "").trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] || text.match(/\{[\s\S]*\}/)?.[0] || text;
  return JSON.parse(candidate);
}

function fallbackPacket(body, message = "DeepSeek is not configured yet. Using deterministic fallback packet.") {
  const listing = body.listing || {};
  const matchedTerms = Array.isArray(listing.matchedTerms) ? listing.matchedTerms.slice(0, 5) : [];
  const route = getDeepSeekRoute(body.task || "application_packet");

  return {
    status: providerConfig.deepSeekKey ? "fallback" : "missing_key",
    generatedBy: providerConfig.deepSeekKey ? "Fallback parser" : "Template fallback",
    model: route.model,
    thinking: route.thinking,
    message,
    packet: {
      resumeFocus: matchedTerms.length
        ? matchedTerms.map((term) => `Emphasize ${term} in the tailored summary and strongest relevant bullets.`)
        : ["Emphasize finance analysis, Excel, communication, and investment research experience."],
      coverNote: `I am interested in the ${listing.role || "internship"} opportunity at ${listing.company || "the company"}. My finance coursework, investment research work, and analytical experience position me to contribute quickly while continuing to grow through a rigorous internship experience.`,
      talkingPoints: [
        `Connect Eric's finance background to ${listing.company || "the employer"}'s internship needs.`,
        "Use concrete evidence from investment research, financial modeling, and presentation work.",
        "Confirm role fit, timing, location, and application requirements before submission."
      ],
      commonAnswers: [
        "Why this company: cite the role description and connect it to finance, markets, and analytical interests.",
        "Availability: confirm semester workload, interview windows, and start-date flexibility.",
        "Work authorization: answer only with Eric's reviewed and approved wording."
      ],
      reviewWarnings: [
        "Student approval required before any application is submitted.",
        "Verify the company career page or durable application link before applying."
      ],
      fitSummary: "This packet was generated without a live LLM response."
    }
  };
}

function getDeepSeekRoute(task = "application_packet") {
  const routes = {
    quick_note: {
      model: providerConfig.deepSeekFastModel,
      thinking: { type: "disabled" },
      timeoutMs: 12000
    },
    resume_rewrite: {
      model: providerConfig.deepSeekFastModel,
      thinking: { type: "disabled" },
      timeoutMs: 15000
    },
    application_packet: {
      model: providerConfig.deepSeekPacketRoute === "pro" ? providerConfig.deepSeekProModel : providerConfig.deepSeekFastModel,
      thinking: providerConfig.deepSeekPacketRoute === "pro"
        ? { type: "enabled", reasoning_effort: "high" }
        : { type: "disabled" },
      timeoutMs: providerConfig.deepSeekPacketRoute === "pro" ? 30000 : 25000
    },
    final_review: {
      model: providerConfig.deepSeekProModel,
      thinking: { type: "enabled", reasoning_effort: "high" },
      timeoutMs: 30000
    }
  };

  return routes[task] || routes.application_packet;
}

function buildApplicationPacketPrompt(body, route) {
  return [
    "TASK: Create an approval-first internship application packet for one student.",
    "STUDENT: Eric Onyango, Loyola University Chicago, BBA Finance.",
    "MODEL ROUTE:",
    JSON.stringify(route),
    "",
    "OUTPUT CONTRACT:",
    "Return one valid JSON object only. Do not wrap it in markdown. Do not add commentary.",
    "Required keys:",
    '{ "resumeFocus": string[], "coverNote": string, "talkingPoints": string[], "commonAnswers": string[], "reviewWarnings": string[], "fitSummary": string }',
    "",
    "QUALITY RULES:",
    "- Be specific to the job and Eric's resume.",
    "- Do not invent facts, dates, awards, employers, or application submission status.",
    "- Keep resumeFocus as actionable edits, not generic advice.",
    "- Keep coverNote under 120 words.",
    "- Include approval/safety warnings before submission.",
    "- If evidence is weak, say what must be verified.",
    "",
    "JOB LISTING JSON:",
    JSON.stringify(body.listing || {}),
    "",
    "BASELINE RESUME JSON:",
    JSON.stringify(body.baselineResume || {}),
    "",
    "RESUME PROFILE JSON:",
    JSON.stringify(body.resumeProfile || {})
  ].join("\n");
}

async function handleApplicationPacket(request, response) {
  const body = await readBody(request);
  const route = getDeepSeekRoute(body.task || "application_packet");

  if (!providerConfig.deepSeekKey) {
    sendJson(response, 200, fallbackPacket(body));
    return;
  }

  const prompt = buildApplicationPacketPrompt(body, route);

  let deepSeekResponse;

  try {
    deepSeekResponse = await postJsonWithTimeout(
      `${providerConfig.deepSeekBaseUrl}/chat/completions`,
      {
        Authorization: `Bearer ${providerConfig.deepSeekKey}`,
        "Content-Type": "application/json"
      },
      {
        model: route.model,
        messages: [
          {
            role: "system",
            content: "You are a precise application-packet generator. You return valid JSON only and follow the output contract exactly."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        thinking: route.thinking,
        response_format: { type: "json_object" },
        temperature: 0.3
      },
      route.timeoutMs
    );
  } catch (error) {
    sendJson(response, 200, fallbackPacket(body, error.message || "DeepSeek request failed."));
    return;
  }

  if (!deepSeekResponse.ok) {
    let message = `DeepSeek returned ${deepSeekResponse.status}.`;
    try {
      const errorPayload = JSON.parse(deepSeekResponse.text);
      message = errorPayload.error?.message || errorPayload.message || message;
    } catch {
      message = deepSeekResponse.text || message;
    }
    sendJson(response, 200, fallbackPacket(body, message));
    return;
  }

  const payload = deepSeekResponse.json();
  const content = payload.choices?.[0]?.message?.content || "";

  try {
    const packet = parseJsonBlock(content);
    sendJson(response, 200, {
      status: "ok",
      generatedBy: "DeepSeek",
      model: route.model,
      thinking: route.thinking,
      message: `AI packet generated with DeepSeek using ${route.model}.`,
      packet
    });
  } catch {
    sendJson(response, 200, fallbackPacket(body, "DeepSeek returned a response that could not be parsed as JSON."));
  }
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 200, {});
    return;
  }

  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  try {
    if (url.pathname === "/api/health") {
      sendJson(response, 200, {
        ok: true,
        providers: {
          theirStack: Boolean(providerConfig.theirStack),
          serpApi: Boolean(providerConfig.serpApi),
          rapidApi: Boolean(providerConfig.rapidApiKey),
          deepSeek: Boolean(providerConfig.deepSeekKey),
          database: Boolean(providerConfig.databaseUrl),
          deepSeekBaseUrl: providerConfig.deepSeekBaseUrl,
          deepSeekFastModel: providerConfig.deepSeekFastModel,
          deepSeekProModel: providerConfig.deepSeekProModel,
          deepSeekPacketRoute: providerConfig.deepSeekPacketRoute,
          deepSeekPacketModel: getDeepSeekRoute("application_packet").model,
          deepSeekPacketThinking: getDeepSeekRoute("application_packet").thinking
        }
      });
      return;
    }

    if (url.pathname === "/api/job-search" && request.method === "POST") {
      await handleJobSearch(request, response);
      return;
    }

    if (url.pathname === "/api/application-packet" && request.method === "POST") {
      await handleApplicationPacket(request, response);
      return;
    }

    if (url.pathname === "/api/applications" && request.method === "GET") {
      await handleListApplications(response);
      return;
    }

    if (url.pathname === "/api/applications" && request.method === "POST") {
      await handleSaveApplication(request, response);
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Unexpected server error" });
  }
});

server.listen(PORT, () => {
  console.log(`Job watcher listening on http://localhost:${PORT}`);
});
