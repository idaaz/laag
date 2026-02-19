-- Migration: Add time_blocks table for high-frequency accountability logging

-- Note: The gist exclusion constraint requires the btree_gist extension.
create extension if not exists btree_gist;

create table if not exists public.time_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default '27161a3b-9776-4484-b614-6ca6c18f2403' references public.users (id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  activity text not null,
  category text not null check (category in ('Deep Work', 'Education', 'Skill', 'Health', 'Entertainment', 'Break', 'Wasted', 'Musical Work', 'Daily Work')),
  is_planned boolean not null default true,
  energy_level integer not null default 3 check (energy_level between 1 and 5),
  output_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  
  -- Ensure no overlapping blocks for the same user (optional, but good for data integrity)
  constraint time_blocks_overlap_check exclude using gist (
    user_id with =,
    tstzrange(start_time, end_time) with &&
  )
);

-- Disable RLS for open access
alter table public.time_blocks disable row level security;

-- Add comment for documentation
comment on table public.time_blocks is 'High-frequency (30-min) accountability logs for Interstitial Journaling.';
