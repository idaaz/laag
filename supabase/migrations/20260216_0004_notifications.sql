-- App Notifications table
create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null, -- 'achievement', 'task', 'habit', 'vision', 'milestone'
  title text not null,
  message text not null,
  data jsonb default '{}'::jsonb, -- metadata for links or icons
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

-- RLS Policies
alter table public.app_notifications enable row level security;
create policy "Users can view their own notifications" on public.app_notifications
  for select using (auth.uid() = user_id);
create policy "Users can update their own notifications" on public.app_notifications
  for update using (auth.uid() = user_id);
create policy "Users can insert their own notifications" on public.app_notifications
  for insert with check (auth.uid() = user_id);

-- Indexes
create index if not exists idx_notifications_user_id on public.app_notifications(user_id);
create index if not exists idx_notifications_is_read on public.app_notifications(is_read) where is_read = false;
