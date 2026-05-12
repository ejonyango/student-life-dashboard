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
    packetId: row.packet_id || "",
    packet: row.packet || null,
    packetGeneratedBy: row.packet_generated_by || "",
    packetModel: row.packet_model || "",
    packetAiStatus: row.packet_ai_status || "",
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
        applications.packet_id,
        applications.created_at,
        applications.updated_at,
        applications.applied_at,
        application_packets.packet,
        application_packets.generated_by as packet_generated_by,
        application_packets.model as packet_model,
        application_packets.ai_status as packet_ai_status,
        coalesce(resume_versions.status || ' baseline', '') as resume_version
      from public.applications
      left join public.application_packets on application_packets.id = applications.packet_id
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

function listingExternalKey(listing) {
  return [
    listing.sourceBoard || "unknown",
    listing.applicationLink || "",
    listing.company || "",
    listing.role || "",
    listing.location || ""
  ].join("|").toLowerCase();
}

async function saveJobListings(listings = []) {
  const pool = getDbPool();
  if (!pool || !Array.isArray(listings) || listings.length === 0) {
    return { saved: 0 };
  }

  const client = await pool.connect();

  try {
    await client.query("begin");

    for (const listing of listings) {
      await client.query(
        `
          insert into public.job_listings (
            external_key,
            company,
            role,
            location,
            source_board,
            source_description,
            application_link,
            company_verification,
            verified_at,
            fit,
            matched_terms,
            raw_payload,
            last_seen_at
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, now(), $9, $10, $11::jsonb, now())
          on conflict (external_key)
          do update set
            company = excluded.company,
            role = excluded.role,
            location = excluded.location,
            source_board = excluded.source_board,
            source_description = excluded.source_description,
            application_link = excluded.application_link,
            company_verification = excluded.company_verification,
            fit = excluded.fit,
            matched_terms = excluded.matched_terms,
            raw_payload = excluded.raw_payload,
            last_seen_at = now()
        `,
        [
          listingExternalKey(listing),
          listing.company || "Unknown company",
          listing.role || "Internship",
          listing.location || "",
          listing.sourceBoard || "Unknown",
          listing.sourceDescription || "",
          listing.applicationLink || "",
          listing.companyVerification || "",
          Number(listing.fit || 0),
          Array.isArray(listing.matchedTerms) ? listing.matchedTerms : [],
          JSON.stringify(listing)
        ]
      );
    }

    await client.query("commit");
    return { saved: listings.length };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function listJobListings() {
  const pool = getDbPool();
  if (!pool) {
    return { ok: false, database: false, listings: [], reason: "database_not_configured" };
  }

  const result = await pool.query(
    `
      select raw_payload, last_seen_at
      from public.job_listings
      order by last_seen_at desc
      limit $1
    `,
    [MAX_RESULTS]
  );

  return {
    ok: true,
    database: true,
    checkedAt: result.rows[0]?.last_seen_at || "",
    listings: result.rows.map((row) => row.raw_payload).filter(Boolean)
  };
}

async function saveResumeVersion(profile, baselineResume) {
  const pool = getDbPool();
  if (!pool) {
    return { ok: false, saved: false, reason: "database_not_configured" };
  }

  const result = await pool.query(
    `
      with student as (
        select id from public.student_profiles where slug = 'eric-onyango' limit 1
      )
      insert into public.resume_versions (
        student_id,
        file_name,
        raw_text,
        baseline_resume,
        skills,
        keywords,
        status,
        approved_at
      )
      values (
        (select id from student),
        $1,
        $2,
        $3::jsonb,
        $4,
        $5,
        $6,
        case when $6 = 'approved' then now() else null end
      )
      returning id, file_name, raw_text, baseline_resume, skills, keywords, status, created_at, approved_at
    `,
    [
      profile.fileName || "Resume",
      profile.text || "",
      JSON.stringify(baselineResume || {}),
      Array.isArray(profile.skills) ? profile.skills : [],
      Array.isArray(profile.keywords) ? profile.keywords : [],
      String(baselineResume?.status || "draft").toLowerCase()
    ]
  );

  return { ok: true, saved: true, resumeVersion: result.rows[0] };
}

async function loadLatestResumeVersion() {
  const pool = getDbPool();
  if (!pool) {
    return { ok: false, database: false, resumeVersion: null, reason: "database_not_configured" };
  }

  const result = await pool.query(
    `
      select resume_versions.*
      from public.resume_versions
      join public.student_profiles on student_profiles.id = resume_versions.student_id
      where student_profiles.slug = 'eric-onyango'
      order by resume_versions.created_at desc
      limit 1
    `
  );

  return { ok: true, database: true, resumeVersion: result.rows[0] || null };
}

async function handleResumeVersion(request, response) {
  if (request.method === "GET") {
    sendJson(response, 200, await loadLatestResumeVersion());
    return;
  }

  const body = await readBody(request);
  sendJson(response, 200, await saveResumeVersion(body.resumeProfile || {}, body.baselineResume || {}));
}

function mapCourseRow(row) {
  return {
    id: row.id,
    course: row.course_name,
    time: row.meeting_pattern || "",
    task: row.raw_payload?.task || "No assignment added yet",
    intensity: row.raw_payload?.intensity || "Medium",
    professor: row.instructor || "",
    location: row.location || "",
    textbook: row.raw_payload?.textbook || "",
    term: row.term || row.raw_payload?.term || ""
  };
}

async function listCourseRecords() {
  const pool = getDbPool();
  if (!pool) {
    return { ok: false, database: false, courses: [], reason: "database_not_configured" };
  }

  const result = await pool.query(
    `
      select course_records.*
      from public.course_records
      join public.student_profiles on student_profiles.id = course_records.student_id
      where student_profiles.slug = 'eric-onyango'
        and course_records.status in ('registered', 'planned')
      order by course_records.created_at asc
    `
  );

  return { ok: true, database: true, courses: result.rows.map(mapCourseRow) };
}

async function saveCourseRecord(course) {
  const pool = getDbPool();
  if (!pool) {
    return { ok: false, saved: false, reason: "database_not_configured" };
  }

  const result = await pool.query(
    `
      with student as (
        select id from public.student_profiles where slug = 'eric-onyango' limit 1
      )
      insert into public.course_records (
        student_id,
        source,
        course_name,
        status,
        instructor,
        meeting_pattern,
        location,
        term,
        raw_payload,
        updated_at
      )
      values ((select id from student), 'manual', $1, 'registered', $2, $3, $4, $5, $6::jsonb, now())
      returning id, course_name, instructor, meeting_pattern, location, term, raw_payload, created_at, updated_at
    `,
    [
      course.course || "Untitled course",
      course.professor || "",
      course.time || "",
      course.location || "",
      course.term || "",
      JSON.stringify(course)
    ]
  );

  return { ok: true, saved: true, course: mapCourseRow(result.rows[0]) };
}

async function deleteCourseRecord(course) {
  const pool = getDbPool();
  if (!pool) {
    return { ok: false, deleted: false, reason: "database_not_configured" };
  }

  const result = await pool.query(
    `
      delete from public.course_records
      using public.student_profiles
      where course_records.student_id = student_profiles.id
        and student_profiles.slug = 'eric-onyango'
        and (
          ($1::uuid is not null and course_records.id = $1::uuid)
          or ($1::uuid is null and course_records.course_name = $2)
        )
      returning course_records.id
    `,
    [
      course.id || null,
      course.course || ""
    ]
  );

  return { ok: true, deleted: result.rowCount > 0 };
}

async function handleCourses(request, response) {
  if (request.method === "GET") {
    sendJson(response, 200, await listCourseRecords());
    return;
  }

  if (request.method === "DELETE") {
    const body = await readBody(request);
    sendJson(response, 200, await deleteCourseRecord(body));
    return;
  }

  const body = await readBody(request);
  sendJson(response, 200, await saveCourseRecord(body.course || body));
}

function mapAssignmentRow(row) {
  return {
    id: row.id,
    courseName: row.course_name,
    title: row.title,
    dueAt: row.due_at,
    textbook: row.textbook || "",
    assignedPages: row.assigned_pages || "",
    details: row.details || "",
    status: row.status,
    priority: row.priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function listAssignments() {
  const pool = getDbPool();
  if (!pool) return { ok: false, database: false, assignments: [], reason: "database_not_configured" };

  const result = await pool.query(
    `
      select assignment_tasks.*
      from public.assignment_tasks
      join public.student_profiles on student_profiles.id = assignment_tasks.student_id
      where student_profiles.slug = 'eric-onyango'
        and assignment_tasks.status != 'archived'
      order by assignment_tasks.due_at nulls last, assignment_tasks.created_at desc
    `
  );

  return { ok: true, database: true, assignments: result.rows.map(mapAssignmentRow) };
}

async function saveAssignment(assignment) {
  const pool = getDbPool();
  if (!pool) return { ok: false, saved: false, reason: "database_not_configured" };

  if (assignment.id) {
    const result = await pool.query(
      `
        update public.assignment_tasks
        set course_name = $2,
            title = $3,
            due_at = nullif($4, '')::timestamptz,
            textbook = $5,
            assigned_pages = $6,
            details = $7,
            status = $8,
            priority = $9,
            updated_at = now()
        where id = $1
        returning *
      `,
      [
        assignment.id,
        assignment.courseName || assignment.course || "General",
        assignment.title || "Untitled assignment",
        assignment.dueAt || "",
        assignment.textbook || "",
        assignment.assignedPages || assignment.pages || "",
        assignment.details || "",
        assignment.status || "open",
        assignment.priority || "medium"
      ]
    );

    return { ok: true, saved: true, assignment: mapAssignmentRow(result.rows[0]) };
  }

  const result = await pool.query(
    `
      with student as (
        select id from public.student_profiles where slug = 'eric-onyango' limit 1
      )
      insert into public.assignment_tasks (
        student_id,
        course_name,
        title,
        due_at,
        textbook,
        assigned_pages,
        details,
        status,
        priority,
        updated_at
      )
      values ((select id from student), $1, $2, nullif($3, '')::timestamptz, $4, $5, $6, $7, $8, now())
      returning *
    `,
    [
      assignment.courseName || assignment.course || "General",
      assignment.title || "Untitled assignment",
      assignment.dueAt || "",
      assignment.textbook || "",
      assignment.assignedPages || assignment.pages || "",
      assignment.details || "",
      assignment.status || "open",
      assignment.priority || "medium"
    ]
  );

  return { ok: true, saved: true, assignment: mapAssignmentRow(result.rows[0]) };
}

async function handleAssignments(request, response) {
  if (request.method === "GET") {
    sendJson(response, 200, await listAssignments());
    return;
  }

  const body = await readBody(request);
  sendJson(response, 200, await saveAssignment(body.assignment || body));
}

function mapClassNoteRow(row) {
  return {
    id: row.id,
    courseName: row.course_name,
    title: row.title,
    noteType: row.note_type,
    content: row.content,
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function listClassNotes() {
  const pool = getDbPool();
  if (!pool) return { ok: false, database: false, notes: [], reason: "database_not_configured" };

  const result = await pool.query(
    `
      select class_notes.*
      from public.class_notes
      join public.student_profiles on student_profiles.id = class_notes.student_id
      where student_profiles.slug = 'eric-onyango'
      order by class_notes.created_at desc
      limit 100
    `
  );

  return { ok: true, database: true, notes: result.rows.map(mapClassNoteRow) };
}

async function saveClassNote(note) {
  const pool = getDbPool();
  if (!pool) return { ok: false, saved: false, reason: "database_not_configured" };

  const result = await pool.query(
    `
      with student as (
        select id from public.student_profiles where slug = 'eric-onyango' limit 1
      )
      insert into public.class_notes (
        student_id,
        course_name,
        title,
        note_type,
        content,
        tags,
        updated_at
      )
      values ((select id from student), $1, $2, $3, $4, $5, now())
      returning *
    `,
    [
      note.courseName || note.course || "General",
      note.title || "Untitled note",
      note.noteType || "notes",
      note.content || "",
      Array.isArray(note.tags) ? note.tags : []
    ]
  );

  return { ok: true, saved: true, note: mapClassNoteRow(result.rows[0]) };
}

async function handleClassNotes(request, response) {
  if (request.method === "GET") {
    sendJson(response, 200, await listClassNotes());
    return;
  }

  const body = await readBody(request);
  sendJson(response, 200, await saveClassNote(body.note || body));
}

function mapCalendarEventRow(row) {
  return {
    id: row.id,
    assignmentId: row.assignment_task_id || "",
    title: row.title,
    courseName: row.course_name || "",
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    location: row.location || "",
    notes: row.notes || "",
    eventType: row.event_type || "study_block",
    source: row.source || "manual",
    googleEventUrl: row.google_event_url || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function listCalendarEvents() {
  const pool = getDbPool();
  if (!pool) return { ok: false, database: false, events: [], reason: "database_not_configured" };

  const result = await pool.query(
    `
      select calendar_events.*
      from public.calendar_events
      join public.student_profiles on student_profiles.id = calendar_events.student_id
      where student_profiles.slug = 'eric-onyango'
        and calendar_events.starts_at >= now() - interval '7 days'
      order by calendar_events.starts_at asc
      limit 100
    `
  );

  return { ok: true, database: true, events: result.rows.map(mapCalendarEventRow) };
}

async function saveCalendarEvent(event) {
  const pool = getDbPool();
  if (!pool) return { ok: false, saved: false, reason: "database_not_configured" };

  const result = await pool.query(
    `
      with student as (
        select id from public.student_profiles where slug = 'eric-onyango' limit 1
      )
      insert into public.calendar_events (
        student_id,
        assignment_task_id,
        title,
        course_name,
        starts_at,
        ends_at,
        location,
        notes,
        event_type,
        source,
        google_event_url,
        updated_at
      )
      values ((select id from student), nullif($1, '')::uuid, $2, $3, nullif($4, '')::timestamptz, nullif($5, '')::timestamptz, $6, $7, $8, $9, $10, now())
      returning *
    `,
    [
      event.assignmentId || event.assignment_task_id || "",
      event.title || "Calendar event",
      event.courseName || event.course_name || "",
      event.startsAt || event.starts_at || "",
      event.endsAt || event.ends_at || event.startsAt || event.starts_at || "",
      event.location || "",
      event.notes || "",
      event.eventType || event.event_type || "study_block",
      event.source || "manual",
      event.googleEventUrl || event.google_event_url || ""
    ]
  );

  return { ok: true, saved: true, event: mapCalendarEventRow(result.rows[0]) };
}

async function deleteCalendarEvents(criteria) {
  const pool = getDbPool();
  if (!pool) return { ok: false, deleted: 0, reason: "database_not_configured" };

  const result = await pool.query(
    `
      delete from public.calendar_events
      using public.student_profiles
      where calendar_events.student_id = student_profiles.id
        and student_profiles.slug = 'eric-onyango'
        and ($1::text is null or calendar_events.source = $1)
      returning calendar_events.id
    `,
    [criteria.source || null]
  );

  return { ok: true, deleted: result.rowCount };
}

async function handleCalendarEvents(request, response) {
  if (request.method === "GET") {
    sendJson(response, 200, await listCalendarEvents());
    return;
  }

  if (request.method === "DELETE") {
    const body = await readBody(request);
    sendJson(response, 200, await deleteCalendarEvents(body));
    return;
  }

  const body = await readBody(request);
  sendJson(response, 200, await saveCalendarEvent(body.event || body));
}

function mapAgentActionRow(row) {
  return {
    id: row.id,
    actionType: row.action_type,
    status: row.status,
    subject: row.subject || "",
    body: row.body || "",
    relatedApplicationId: row.related_application_id || "",
    createdAt: row.created_at,
    approvedAt: row.approved_at,
    completedAt: row.completed_at
  };
}

async function listAgentActions() {
  const pool = getDbPool();
  if (!pool) {
    return { ok: false, database: false, actions: [], reason: "database_not_configured" };
  }

  const result = await pool.query(
    `
      select agent_actions.*
      from public.agent_actions
      join public.student_profiles on student_profiles.id = agent_actions.student_id
      where student_profiles.slug = 'eric-onyango'
      order by agent_actions.created_at desc
      limit 50
    `
  );

  return { ok: true, database: true, actions: result.rows.map(mapAgentActionRow) };
}

async function saveAgentAction(action) {
  const pool = getDbPool();
  if (!pool) {
    return { ok: false, saved: false, reason: "database_not_configured" };
  }

  if (action.id) {
    const result = await pool.query(
      `
        update public.agent_actions
        set status = $2,
            approved_at = case when $2 = 'approved' then now() else approved_at end,
            completed_at = case when $2 in ('sent', 'skipped', 'error') then now() else completed_at end
        where id = $1
        returning *
      `,
      [action.id, action.status || "draft"]
    );

    return { ok: true, saved: true, action: mapAgentActionRow(result.rows[0]) };
  }

  const result = await pool.query(
    `
      with student as (
        select id from public.student_profiles where slug = 'eric-onyango' limit 1
      )
      insert into public.agent_actions (
        student_id,
        action_type,
        status,
        subject,
        body
      )
      values ((select id from student), $1, 'draft', $2, $3)
      returning *
    `,
    [
      action.actionType || action.action_type || "manual_action",
      action.subject || "Agent action draft",
      action.body || ""
    ]
  );

  return { ok: true, saved: true, action: mapAgentActionRow(result.rows[0]) };
}

async function handleAgentActions(request, response) {
  if (request.method === "GET") {
    sendJson(response, 200, await listAgentActions());
    return;
  }

  const body = await readBody(request);
  sendJson(response, 200, await saveAgentAction(body.action || body));
}

async function saveApplicationPacketRecord(client, studentId, application) {
  if (!application.packet) return null;

  const result = await client.query(
    `
      insert into public.application_packets (
        student_id,
        generated_by,
        model,
        ai_status,
        packet,
        approved_by_student,
        approved_at
      )
      values ($1, $2, $3, $4, $5::jsonb, $6, case when $6 then now() else null end)
      returning id
    `,
    [
      studentId,
      application.packet.generatedBy || "Unknown",
      application.packet.model || "unknown",
      application.packet.aiStatus || "draft",
      JSON.stringify(application.packet),
      application.status === "Applied"
    ]
  );

  return result.rows[0]?.id || null;
}

async function saveApplicationRecord(application) {
  const pool = getDbPool();
  if (!pool) {
    return { ok: false, saved: false, reason: "database_not_configured" };
  }

  const client = await pool.connect();

  try {
    await client.query("begin");

    const studentResult = await client.query(
      "select id from public.student_profiles where slug = 'eric-onyango' limit 1"
    );
    const studentId = studentResult.rows[0]?.id;

    if (!studentId) {
      throw new Error("Student profile eric-onyango was not found.");
    }

    const packetId = await saveApplicationPacketRecord(client, studentId, application);

    const result = await client.query(
      `
        insert into public.applications (
          student_id,
          packet_id,
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
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          now(),
          case when $5 = 'applied' then now() else null end
        )
        on conflict (student_id, company, role)
        do update set
          packet_id = coalesce(excluded.packet_id, public.applications.packet_id),
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
        returning id, packet_id, company, role, status, next_step, fit, source, application_link, created_at, updated_at, applied_at
      `,
      [
        studentId,
        packetId,
        application.company,
        application.role,
        toDatabaseStatus(application.status),
        application.next || "",
        Number(application.fit || 0),
        application.source || "",
        application.applicationLink || ""
      ]
    );

    if (toDatabaseStatus(application.status) === "follow_up") {
      await client.query(
        `
          insert into public.agent_actions (
            student_id,
            action_type,
            status,
            subject,
            body,
            related_application_id
          )
          values ($1, 'follow_up_email', 'draft', $2, $3, $4)
        `,
        [
          studentId,
          `Follow up with ${application.company}`,
          `Draft a concise follow-up for Eric regarding the ${application.role} application at ${application.company}.`,
          result.rows[0].id
        ]
      );
    }

    if (toDatabaseStatus(application.status) === "interview") {
      await client.query(
        `
          insert into public.interviews (
            application_id,
            interview_type,
            notes
          )
          values ($1, 'Prep needed', $2)
        `,
        [
          result.rows[0].id,
          `Prepare Eric for ${application.company}'s ${application.role} interview.`
        ]
      );
    }

    await client.query("commit");
    return { ok: true, saved: true, packetSaved: Boolean(packetId), application: result.rows[0] };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
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

function getTextWithTimeout(url, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const request = httpsRequest(
      {
        hostname: target.hostname,
        path: `${target.pathname}${target.search}`,
        method: "GET",
        headers: {
          "User-Agent": "student-life-dashboard/0.1"
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
            text: responseBody
          });
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(new Error(`Request timed out after ${timeoutMs / 1000} seconds.`));
    });
    request.on("error", reject);
    request.end();
  });
}

function decodeXml(value = "") {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

async function fetchRenewableEnergyNews() {
  const query = encodeURIComponent("renewable energy investment finance markets");
  const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
  const response = await getTextWithTimeout(url, 12000);

  if (!response.ok) return [];

  return Array.from(response.text.matchAll(/<item>([\s\S]*?)<\/item>/g))
    .slice(0, 8)
    .map((match) => {
      const item = match[1];
      const title = decodeXml(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "");
      const link = decodeXml(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "");
      const published = decodeXml(item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "");
      const source = decodeXml(item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || "Google News");
      return { title, link, published, source };
    })
    .filter((item) => item.title && item.link);
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
  let databaseSaved = 0;

  try {
    const saveResult = await saveJobListings(listings);
    databaseSaved = saveResult.saved;
  } catch {
    databaseSaved = 0;
  }

  sendJson(response, 200, {
    checkedAt: new Date().toISOString(),
    query: search.query,
    listings,
    databaseSaved,
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
    },
    agent_action: {
      model: providerConfig.deepSeekFastModel,
      thinking: { type: "disabled" },
      timeoutMs: 30000
    }
  };

  return routes[task] || routes.application_packet;
}

function buildAgentActionPrompt(body, route) {
  const action = body.action || {};
  const isRenewableBrief = action.actionType === "renewable_energy_newsletter";
  const isAssignmentCheckin = action.actionType === "assignment_checkin";
  const isResearchAdvisor = action.actionType === "research_advisor";

  return [
    isRenewableBrief
      ? "TASK: Draft an approval-required renewable energy investing intelligence brief for Eric Onyango."
      : "TASK: Improve or draft one approval-required agent action for Eric Onyango.",
    "STUDENT: Eric Onyango, Loyola University Chicago, BBA Finance.",
    "MODEL ROUTE:",
    JSON.stringify(route),
    "",
    "OUTPUT CONTRACT:",
    "Return one valid JSON object only. Do not wrap it in markdown.",
    isRenewableBrief
      ? 'Required keys: { "subject": string, "body": string, "trendThemes": string[], "importantDevelopments": string[], "industryImpacts": string[], "investmentAngles": string[], "sourceNotes": string[], "approvalChecklist": string[], "riskNotes": string[] }'
      : isAssignmentCheckin
        ? 'Required keys: { "subject": string, "body": string, "actionPlan": string[], "scheduleBlocks": string[], "studyPlanBlocks": Array<{ "assignmentTitle": string, "courseName": string, "title": string, "focus": string, "daysBeforeDue": number, "preferredStartTime": string, "durationMinutes": number, "priority": "low" | "medium" | "high" }>, "clarifyingQuestions": string[], "approvalChecklist": string[], "riskNotes": string[] }'
      : isResearchAdvisor
        ? 'Required keys: { "subject": string, "body": string, "researchPlan": string[], "suggestedSources": string[], "searchKeywords": string[], "clarifyingQuestions": string[], "approvalChecklist": string[], "riskNotes": string[] }'
      : 'Required keys: { "subject": string, "body": string, "approvalChecklist": string[], "riskNotes": string[] }',
    "",
    "QUALITY RULES:",
    "- Keep the result truthful and specific to Eric's finance internship goals.",
    "- Do not claim anything was sent, submitted, posted, scheduled, or approved.",
    "- Keep body concise and ready for student review.",
    "- Include concrete approval checks before the action can be used.",
    ...(isRenewableBrief ? [
      "- Identify 3-5 cross-article trend themes, not just isolated headlines.",
      "- Highlight important developments from the supplied news items and name the source for each.",
      "- Explain likely industry impact: developers, utilities, grid operators, manufacturers, investors, policy, financing, or commodity exposure.",
      "- Explain investment relevance: cost of capital, project finance, tax credits, demand growth, margin pressure, M&A, risk, or valuation implications.",
      "- Include student takeaways useful for interviews, coursework, and internship networking.",
      "- If the news evidence is thin or repetitive, say what needs more verification."
    ] : []),
    ...(isAssignmentCheckin ? [
      "- Use assignment due dates to create a practical action plan to finish work on time.",
      "- Use textbook and assigned page ranges when provided to make reading and study blocks concrete.",
      "- Break work into schedule blocks ordered by urgency.",
      "- Return studyPlanBlocks as structured calendar-ready AI recommendations.",
      "- Each studyPlanBlocks item must map to a real assignment by assignmentTitle and courseName.",
      "- Use daysBeforeDue instead of exact dates. Use 0 only for work that should happen on the due date.",
      "- Use preferredStartTime such as \"6:00 PM\" or \"7:30 PM\" and durationMinutes between 30 and 180.",
      "- Generate 1-3 studyPlanBlocks per open assignment depending on urgency and complexity.",
      "- Ask for missing assignment details, rubrics, or due dates when necessary.",
      "- Consider current courses and avoid overloading one day."
    ] : []),
    ...(isResearchAdvisor ? [
      "- Use pasted class notes, lecture transcripts, and assignment context to guide the response.",
      "- Suggest credible source categories such as academic databases, course readings, government datasets, company filings, industry reports, and library resources.",
      "- Provide search keywords and a step-by-step research plan.",
      "- Do not fabricate citations or claim sources were read unless supplied in the notes."
    ] : []),
    "",
    "AGENT ACTION JSON:",
    JSON.stringify(body.action || {}),
    "",
    "RESUME PROFILE JSON:",
    JSON.stringify(body.resumeProfile || {}),
    "",
    "BASELINE RESUME JSON:",
    JSON.stringify(body.baselineResume || {}),
    "",
    "COURSES JSON:",
    JSON.stringify(body.courses || []),
    "",
    "ASSIGNMENTS JSON:",
    JSON.stringify(body.assignments || []),
    "",
    "CLASS NOTES JSON:",
    JSON.stringify(body.classNotes || []),
    "",
    "CURRENT NEWS ITEMS JSON:",
    JSON.stringify(body.newsItems || [])
  ].join("\n");
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

async function handleAgentActionGenerate(request, response) {
  const body = await readBody(request);
  const route = getDeepSeekRoute("agent_action");
  const action = body.action || {};
  const newsItems = action.actionType === "renewable_energy_newsletter"
    ? await fetchRenewableEnergyNews().catch(() => [])
    : [];
  const promptBody = { ...body, newsItems };

  if (!providerConfig.deepSeekKey) {
    sendJson(response, 200, {
      status: "missing_key",
      generatedBy: "Template fallback",
      model: route.model,
      message: "DeepSeek is not configured.",
      draft: {
        subject: action.subject || "Agent action draft",
        body: action.body || "Draft this action for Eric, then require student approval before use.",
        approvalChecklist: ["Eric must review before anything is sent or posted."],
        riskNotes: ["No automatic sending is allowed."]
      }
    });
    return;
  }

  try {
    const deepSeekResponse = await postJsonWithTimeout(
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
            content: "You draft approval-required student career agent actions. Return valid JSON only."
          },
          {
            role: "user",
            content: buildAgentActionPrompt(promptBody, route)
          }
        ],
        thinking: route.thinking,
        response_format: { type: "json_object" },
        temperature: 0.35
      },
      route.timeoutMs
    );

    if (!deepSeekResponse.ok) {
      sendJson(response, 200, {
        status: "fallback",
        generatedBy: "Fallback parser",
        model: route.model,
        message: `DeepSeek returned ${deepSeekResponse.status}.`,
        draft: {
          subject: action.subject || "Agent action draft",
          body: action.body || "Draft this action for Eric, then require student approval before use.",
          approvalChecklist: ["Eric must review before anything is sent or posted."],
          riskNotes: ["DeepSeek response was unavailable."]
        }
      });
      return;
    }

    const payload = JSON.parse(deepSeekResponse.text);
    const draft = parseJsonBlock(payload.choices?.[0]?.message?.content || "{}");
    sendJson(response, 200, {
      status: "ok",
      generatedBy: "DeepSeek",
      model: route.model,
      message: `Agent draft generated with ${route.model}.`,
      draft
    });
  } catch (error) {
    sendJson(response, 200, {
      status: "fallback",
      generatedBy: "Fallback parser",
      model: route.model,
      message: error.message || "DeepSeek agent draft failed.",
      draft: {
        subject: action.subject || "Agent action draft",
        body: action.body || "Draft this action for Eric, then require student approval before use.",
        approvalChecklist: ["Eric must review before anything is sent or posted."],
        riskNotes: ["AI draft generation failed."]
      }
    });
  }
}

async function handleAdvisorGenerate(request, response) {
  const body = await readBody(request);
  const taskType = body.taskType || "research_advisor";
  const action = {
    actionType: taskType === "intelligence_brief" ? "renewable_energy_newsletter" : taskType,
    subject: body.topic || "Advisor request",
    body: body.prompt || ""
  };
  const newsItems = taskType === "intelligence_brief"
    ? await fetchRenewableEnergyNews().catch(() => [])
    : [];
  const route = getDeepSeekRoute("agent_action");
  const promptBody = {
    action,
    resumeProfile: body.resumeProfile || {},
    baselineResume: body.baselineResume || {},
    courses: body.courses || [],
    assignments: body.assignments || [],
    classNotes: body.classNotes || [],
    newsItems
  };

  if (!providerConfig.deepSeekKey) {
    sendJson(response, 200, {
      status: "missing_key",
      generatedBy: "Template fallback",
      model: route.model,
      message: "DeepSeek is not configured.",
      result: {
        subject: action.subject,
        body: action.body || "Add a prompt, assignment, or topic to generate advisor output.",
        sections: []
      }
    });
    return;
  }

  try {
    const deepSeekResponse = await postJsonWithTimeout(
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
            content: "You are Eric Onyango's academic and career research advisor. Return valid JSON only."
          },
          {
            role: "user",
            content: buildAgentActionPrompt(promptBody, route)
          }
        ],
        thinking: route.thinking,
        response_format: { type: "json_object" },
        temperature: 0.35
      },
      route.timeoutMs
    );

    if (!deepSeekResponse.ok) {
      sendJson(response, 200, {
        status: "fallback",
        generatedBy: "Fallback parser",
        model: route.model,
        message: `DeepSeek returned ${deepSeekResponse.status}.`,
        result: {
          subject: action.subject,
          body: action.body || "Advisor output unavailable.",
          sections: []
        }
      });
      return;
    }

    const payload = JSON.parse(deepSeekResponse.text);
    const result = parseJsonBlock(payload.choices?.[0]?.message?.content || "{}");
    sendJson(response, 200, {
      status: "ok",
      generatedBy: "DeepSeek",
      model: route.model,
      message: `Advisor response generated with ${route.model}.`,
      result
    });
  } catch (error) {
    sendJson(response, 200, {
      status: "fallback",
      generatedBy: "Fallback parser",
      model: route.model,
      message: error.message || "Advisor generation failed.",
      result: {
        subject: action.subject,
        body: action.body || "Advisor output unavailable.",
        sections: []
      }
    });
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

    if (url.pathname === "/api/job-listings" && request.method === "GET") {
      sendJson(response, 200, await listJobListings());
      return;
    }

    if (url.pathname === "/api/application-packet" && request.method === "POST") {
      await handleApplicationPacket(request, response);
      return;
    }

    if (url.pathname === "/api/agent-action-generate" && request.method === "POST") {
      await handleAgentActionGenerate(request, response);
      return;
    }

    if (url.pathname === "/api/advisor-generate" && request.method === "POST") {
      await handleAdvisorGenerate(request, response);
      return;
    }

    if (url.pathname === "/api/resume-version" && (request.method === "GET" || request.method === "POST")) {
      await handleResumeVersion(request, response);
      return;
    }

    if (url.pathname === "/api/courses" && (request.method === "GET" || request.method === "POST" || request.method === "DELETE")) {
      await handleCourses(request, response);
      return;
    }

    if (url.pathname === "/api/assignments" && (request.method === "GET" || request.method === "POST")) {
      await handleAssignments(request, response);
      return;
    }

    if (url.pathname === "/api/class-notes" && (request.method === "GET" || request.method === "POST")) {
      await handleClassNotes(request, response);
      return;
    }

    if (url.pathname === "/api/calendar-events" && (request.method === "GET" || request.method === "POST" || request.method === "DELETE")) {
      await handleCalendarEvents(request, response);
      return;
    }

    if (url.pathname === "/api/agent-actions" && (request.method === "GET" || request.method === "POST")) {
      await handleAgentActions(request, response);
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
