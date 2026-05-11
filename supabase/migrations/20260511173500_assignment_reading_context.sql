alter table public.assignment_tasks
  add column if not exists textbook text,
  add column if not exists assigned_pages text;
