create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  timezone text not null default 'America/Los_Angeles',
  truth_mode_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 200),
  description text,
  priority public.task_priority not null default 'medium',
  status public.task_status not null default 'todo',
  deadline_at timestamptz,
  completed_at timestamptz,
  xp_base integer not null default 10,
  xp_bonus integer not null default 0,
  xp_awarded integer not null default 0,
  is_flagged boolean not null default false,
  override_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  frequency_per_week integer not null default 5 check (frequency_per_week between 1 and 7),
  xp_per_completion integer not null default 12 check (xp_per_completion > 0),
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_completed_on date,
  relapse_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  log_date date not null,
  study_minutes integer not null default 0 check (study_minutes between 0 and 1440),
  workout_minutes integer not null default 0 check (workout_minutes between 0 and 600),
  sleep_hours numeric(4,2) not null default 0 check (sleep_hours between 0 and 24),
  screen_minutes integer not null default 0 check (screen_minutes between 0 and 1440),
  mood integer not null default 5 check (mood between 1 and 10),
  productivity integer not null default 5 check (productivity between 1 and 10),
  daily_log_completion numeric(5,4) not null default 0 check (daily_log_completion between 0 and 1),
  journal_ciphertext text,
  journal_iv text,
  journal_salt text,
  retro_edit_flag boolean not null default false,
  edit_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, log_date)
);

create table if not exists public.relapse_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  habit_id uuid references public.habits (id) on delete set null,
  relapse_at timestamptz not null default timezone('utc', now()),
  severity integer not null default 1 check (severity between 1 and 10),
  trigger text,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.screen_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  log_date date not null,
  source public.screen_log_source not null default 'manual',
  minutes integer not null default 0 check (minutes between 0 and 1440),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, log_date, source)
);

create table if not exists public.timers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  session_type public.timer_session_type not null,
  started_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz,
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  completed boolean not null default false,
  interruptions integer not null default 0 check (interruptions >= 0),
  xp_awarded integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  source_type text not null,
  source_id uuid,
  delta_xp integer not null,
  reason text,
  capped boolean not null default false,
  decay_applied boolean not null default false,
  tone_used public.notification_tone,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  type public.notification_type not null,
  tone public.notification_tone not null default 'motivational',
  title text not null,
  body text not null,
  scheduled_for timestamptz,
  sent_at timestamptz,
  read_at timestamptz,
  escalation_level integer not null default 0 check (escalation_level between 0 and 5),
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  code text not null,
  title text not null,
  description text not null,
  unlocked_at timestamptz not null default timezone('utc', now()),
  meta jsonb not null default '{}'::jsonb,
  unique (user_id, code)
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique default auth.uid() references public.users (id) on delete cascade,
  xp_rules jsonb not null default '{}'::jsonb,
  discipline_rules jsonb not null default '{}'::jsonb,
  notification_prefs jsonb not null default '{}'::jsonb,
  lock_mode jsonb not null default '{}'::jsonb,
  brutal_truth_mode boolean not null default true,
  recovery_threshold integer not null default 45 check (recovery_threshold between 0 and 100),
  strictness_profile jsonb not null default '{"mode":"adaptive"}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.themes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  theme_key text not null,
  name text not null,
  palette jsonb not null default '{}'::jsonb,
  is_active boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, theme_key)
);

create table if not exists public.unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  unlock_type public.unlock_type not null,
  unlock_key text not null,
  unlocked_at timestamptz not null default timezone('utc', now()),
  unique (user_id, unlock_type, unlock_key)
);

create table if not exists public.discipline_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  snapshot_date date not null,
  score numeric(5,2) not null check (score between 0 and 100),
  completed_tasks integer not null default 0 check (completed_tasks >= 0),
  total_tasks integer not null default 0 check (total_tasks >= 0),
  habit_consistency numeric(5,4) not null default 0 check (habit_consistency between 0 and 1),
  daily_log_completion numeric(5,4) not null default 0 check (daily_log_completion between 0 and 1),
  burnout_index numeric(5,2) not null default 0 check (burnout_index between 0 and 100),
  overconfidence_index numeric(5,2) not null default 0 check (overconfidence_index between 0 and 100),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, snapshot_date)
);

create table if not exists public.analytics_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  metric_key text not null,
  period_start date not null,
  period_end date not null,
  payload jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default (timezone('utc', now()) + interval '15 minutes'),
  cache_version integer not null default 1,
  unique (user_id, metric_key, period_start, period_end)
);
