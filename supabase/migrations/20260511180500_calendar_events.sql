create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  course_record_id uuid references public.course_records(id) on delete set null,
  title text not null,
  course_name text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  notes text,
  event_type text not null default 'study_block' check (event_type in ('study_block', 'class_event', 'interview', 'deadline', 'personal')),
  google_event_url text,
  google_event_id text,
  sync_status text not null default 'not_synced' check (sync_status in ('not_synced', 'handoff', 'synced', 'error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_calendar_events_student_start on public.calendar_events(student_id, starts_at);

alter table public.calendar_events enable row level security;
