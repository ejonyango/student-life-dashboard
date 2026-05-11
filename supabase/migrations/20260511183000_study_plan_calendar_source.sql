alter table public.calendar_events
  add column if not exists assignment_task_id uuid references public.assignment_tasks(id) on delete set null,
  add column if not exists source text not null default 'manual' check (source in ('manual', 'advisor_study_plan'));

create index if not exists idx_calendar_events_student_source on public.calendar_events(student_id, source, starts_at);
