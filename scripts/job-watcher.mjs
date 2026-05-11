import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { URL } from "node:url";

if (existsSync(".env")) {
  const envFile = readFileSync(".env", "utf8");
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

const PORT = Number(process.env.JOB_WATCHER_PORT || 8787);
const MAX_RESULTS = 500;

const providerConfig = {
  theirStack: process.env.THEIRSTACK_API_KEY || "",
  serpApi: process.env.SERPAPI_API_KEY || "",
  jobdata: process.env.JOBDATA_API_KEY || ""
};

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
  if (provider === "jobdata") return "JobdataAPI";
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
    raw.company ||
    raw.company_name ||
    raw.company_object?.name ||
    raw.organization ||
    raw.employer_name ||
    "Unknown company";
  const location =
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
    raw.apply_url ||
    raw.application_url ||
    raw.redirect_url ||
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

async function providerError(response, provider) {
  const text = await response.text();
  try {
    const payload = JSON.parse(text);
    return payload.error?.description || payload.error?.title || `${provider} returned ${response.status}.`;
  } catch {
    return text ? `${provider} returned ${response.status}: ${text.slice(0, 180)}` : `${provider} returned ${response.status}.`;
  }
}

async function fetchTheirStack(search) {
  if (!providerConfig.theirStack) {
    return { provider: "TheirStack", status: "missing_key", message: "Set THEIRSTACK_API_KEY to enable TheirStack.", listings: [] };
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
    return { provider: "TheirStack", status: "error", message: await providerError(response, "TheirStack"), listings: [] };
  }

  const payload = await response.json();
  const jobs = payload.data || payload.jobs || payload.results || [];
  return {
    provider: "TheirStack",
    status: "ok",
    message: `${jobs.length} jobs returned.`,
    listings: jobs.map((job) => normalizeListing(job, "theirstack"))
  };
}

async function fetchSerpApi(search) {
  if (!providerConfig.serpApi) {
    return { provider: "SerpApi", status: "missing_key", message: "Set SERPAPI_API_KEY to enable Google Jobs discovery.", listings: [] };
  }

  const params = new URLSearchParams({
    engine: "google_jobs",
    q: search.query,
    location: "Chicago, Illinois, United States",
    hl: "en",
    api_key: providerConfig.serpApi
  });
  const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);

  if (!response.ok) {
    return { provider: "SerpApi", status: "error", message: await providerError(response, "SerpApi"), listings: [] };
  }

  const payload = await response.json();
  const jobs = payload.jobs_results || [];
  return {
    provider: "SerpApi",
    status: "ok",
    message: `${jobs.length} jobs returned.`,
    listings: jobs.map((job) => normalizeListing(job, "serpapi"))
  };
}

async function fetchJobdata(search) {
  if (!providerConfig.jobdata) {
    return { provider: "JobdataAPI", status: "missing_key", message: "Set JOBDATA_API_KEY to enable JobdataAPI.", listings: [] };
  }

  const params = new URLSearchParams({
    title: search.query,
    location: "Chicago",
    max_age: "30"
  });
  const response = await fetch(`https://jobdataapi.com/api/jobs/?${params.toString()}`, {
    headers: {
      Authorization: `Api-Key ${providerConfig.jobdata}`
    }
  });

  if (!response.ok) {
    return { provider: "JobdataAPI", status: "error", message: await providerError(response, "JobdataAPI"), listings: [] };
  }

  const payload = await response.json();
  const jobs = payload.results || payload.data || payload.jobs || [];
  return {
    provider: "JobdataAPI",
    status: "ok",
    message: `${jobs.length} jobs returned.`,
    listings: jobs.map((job) => normalizeListing(job, "jobdata"))
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
    fetchJobdata(search)
  ]);

  const providerResults = settled.map((result, index) => {
    if (result.status === "fulfilled") return result.value;
    return {
      provider: ["TheirStack", "SerpApi", "JobdataAPI"][index],
      status: "error",
      message: result.reason?.message || "Provider request failed.",
      listings: []
    };
  });
  const listings = dedupe(providerResults.flatMap((result) => result.listings)).slice(0, MAX_RESULTS);

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
          jobdata: Boolean(providerConfig.jobdata)
        }
      });
      return;
    }

    if (url.pathname === "/api/job-search" && request.method === "POST") {
      await handleJobSearch(request, response);
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
