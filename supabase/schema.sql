-- Create tables for Pomofit app

-- Enable RLS (Row Level Security)
alter default privileges revoke execute on functions from public;

-- Create tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  completed boolean not null default false,
  "order" integer not null,
  created_at timestamp with time zone default now(),
  user_id uuid references auth.users(id) on delete cascade not null,
  pomodoros integer default 0,
  completed_at timestamp with time zone
);

-- Create sessions table
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  start_time timestamp with time zone not null,
  duration integer not null,
  mode text not null,
  note text,
  tags text[],
  task_id uuid references public.tasks(id) on delete set null,
  task_title text,
  user_id uuid references auth.users(id) on delete cascade not null
);

-- Create settings table
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  pomodoro_time integer not null default 25,
  short_break_time integer not null default 5,
  long_break_time integer not null default 15,
  pomodoro_goal integer not null default 8,
  workout_gifs text[] not null default '{"pushups", "squats", "lunges", "jumping-jacks", "plank"}',
  workout_sources jsonb not null default '{"lottie": true, "fiton": true}'::jsonb,
  fiton_workouts jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.tasks enable row level security;
alter table public.sessions enable row level security;
alter table public.settings enable row level security;

-- Create policies
create policy "Users can only see their own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

create policy "Users can only see their own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sessions"
  on public.sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own sessions"
  on public.sessions for delete
  using (auth.uid() = user_id);

create policy "Users can only see their own settings"
  on public.settings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own settings"
  on public.settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on public.settings for update
  using (auth.uid() = user_id);

create policy "Users can delete their own settings"
  on public.settings for delete
  using (auth.uid() = user_id);

-- Create indexes
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists sessions_user_id_idx on public.sessions(user_id);
create index if not exists settings_user_id_idx on public.settings(user_id);
