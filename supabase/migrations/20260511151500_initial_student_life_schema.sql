create extension if not exists pgcrypto;

create table if not exists public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  full_name text not null,
  school text not null,
  major text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  file_name text,
  raw_text text,
  baseline_resume jsonb not null default '{}'::jsonb,
  skills text[] not null default '{}',
  keywords text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'approved', 'archived')),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table if not exists public.job_listings (
  id uuid primary key default gen_random_uuid(),
  external_key text not null unique,
  company text not null,
  role text not null,
  location text,
  source_board text not null,
  source_description text,
  application_link text,
  company_verification text,
  verified_at timestamptz,
  fit integer not null default 0 check (fit >= 0 and fit <= 100),
  matched_terms text[] not null default '{}',
  raw_payload jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.application_packets (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  listing_id uuid references public.job_listings(id) on delete set null,
  resume_version_id uuid references public.resume_versions(id) on delete set null,
  generated_by text not null,
  model text not null,
  ai_status text not null,
  packet jsonb not null default '{}'::jsonb,
  approved_by_student boolean not null default false,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  listing_id uuid references public.job_listings(id) on delete set null,
  packet_id uuid references public.application_packets(id) on delete set null,
  resume_version_id uuid references public.resume_versions(id) on delete set null,
  company text not null,
  role text not null,
  status text not null default 'drafting' check (status in ('drafting', 'applied', 'interview', 'follow_up', 'offer_prep', 'closed')),
  next_step text,
  fit integer not null default 0 check (fit >= 0 and fit <= 100),
  source text,
  application_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  applied_at timestamptz
);

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  interview_at timestamptz,
  interview_type text,
  contact_name text,
  contact_email text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.course_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  source text not null default 'manual',
  term text,
  course_code text,
  course_name text not null,
  status text not null default 'planned' check (status in ('planned', 'registered', 'completed', 'dropped')),
  credits numeric(4, 2),
  grade text,
  instructor text,
  meeting_pattern text,
  location text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_actions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  action_type text not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'sent', 'skipped', 'error')),
  subject text,
  body text,
  related_application_id uuid references public.applications(id) on delete set null,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  completed_at timestamptz
);

insert into public.student_profiles (slug, full_name, school, major)
values ('eric-onyango', 'Eric Onyango', 'Loyola University Chicago', 'BBA Finance')
on conflict (slug) do update
set full_name = excluded.full_name,
    school = excluded.school,
    major = excluded.major,
    updated_at = now();

create index if not exists idx_resume_versions_student on public.resume_versions(student_id, created_at desc);
create index if not exists idx_job_listings_last_seen on public.job_listings(last_seen_at desc);
create index if not exists idx_application_packets_student on public.application_packets(student_id, created_at desc);
create index if not exists idx_applications_student_status on public.applications(student_id, status, updated_at desc);
create unique index if not exists idx_applications_student_company_role on public.applications(student_id, company, role);
create index if not exists idx_course_records_student_status on public.course_records(student_id, status);
create index if not exists idx_agent_actions_student_status on public.agent_actions(student_id, status, created_at desc);

alter table public.student_profiles enable row level security;
alter table public.resume_versions enable row level security;
alter table public.job_listings enable row level security;
alter table public.application_packets enable row level security;
alter table public.applications enable row level security;
alter table public.interviews enable row level security;
alter table public.course_records enable row level security;
alter table public.agent_actions enable row level security;
