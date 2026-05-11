create table if not exists public.assignment_tasks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  course_record_id uuid references public.course_records(id) on delete set null,
  course_name text not null,
  title text not null,
  due_at timestamptz,
  details text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'done', 'archived')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.class_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  course_record_id uuid references public.course_records(id) on delete set null,
  course_name text not null,
  title text not null,
  note_type text not null default 'notes' check (note_type in ('notes', 'lecture_transcript', 'reading', 'research')),
  content text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_assignment_tasks_student_due on public.assignment_tasks(student_id, due_at, status);
create index if not exists idx_class_notes_student_course on public.class_notes(student_id, course_name, created_at desc);

alter table public.assignment_tasks enable row level security;
alter table public.class_notes enable row level security;
