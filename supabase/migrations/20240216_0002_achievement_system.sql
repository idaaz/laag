-- Achievement system enhancements
-- Creates tables for achievement definitions and progress tracking

-- Achievement definitions table (master list of all achievements)
create table if not exists public.achievement_definitions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null,
  category text not null check (category in ('tasks', 'habits', 'productivity', 'analytics', 'wellness', 'social', 'milestones', 'special')),
  tier text not null default 'bronze' check (tier in ('bronze', 'silver', 'gold', 'platinum')),
  icon_name text not null default 'trophy',
  unlock_condition jsonb not null,
  xp_reward integer not null default 50 check (xp_reward >= 0),
  is_hidden boolean not null default false,
  is_repeatable boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

-- Achievement progress tracking table
create table if not exists public.achievement_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  achievement_code text not null,
  current_value integer not null default 0,
  target_value integer not null,
  last_updated timestamptz not null default timezone('utc', now()),
  unique (user_id, achievement_code)
);

-- Indexes for performance
create index if not exists idx_achievement_definitions_category on public.achievement_definitions(category);
create index if not exists idx_achievement_definitions_tier on public.achievement_definitions(tier);
create index if not exists idx_achievement_progress_user_id on public.achievement_progress(user_id);
create index if not exists idx_achievement_progress_achievement_code on public.achievement_progress(achievement_code);

-- RLS policies for achievement_definitions (public read, no write)
alter table public.achievement_definitions enable row level security;

drop policy if exists achievement_definitions_select_all on public.achievement_definitions;
create policy achievement_definitions_select_all on public.achievement_definitions
  for select using (true);

-- RLS policies for achievement_progress
alter table public.achievement_progress enable row level security;

drop policy if exists achievement_progress_select_own on public.achievement_progress;
create policy achievement_progress_select_own on public.achievement_progress
  for select using (user_id = auth.uid());

drop policy if exists achievement_progress_insert_own on public.achievement_progress;
create policy achievement_progress_insert_own on public.achievement_progress
  for insert with check (user_id = auth.uid());

drop policy if exists achievement_progress_update_own on public.achievement_progress;
create policy achievement_progress_update_own on public.achievement_progress
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists achievement_progress_delete_own on public.achievement_progress;
create policy achievement_progress_delete_own on public.achievement_progress
  for delete using (user_id = auth.uid());
