-- tracking_custom_rules table definition

create table if not exists public.tracking_custom_rules (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references public.users (id) on delete cascade,
    url_prefix text not null check (char_length(url_prefix) >= 3),
    name text not null check (char_length(name) between 1 and 100),
    created_at timestamptz not null default timezone('utc', now()),
    unique(user_id, url_prefix)
);

-- RLS Policies
alter table public.tracking_custom_rules enable row level security;

create policy "Users can view their own custom rules"
    on public.tracking_custom_rules for select
    using (auth.uid() = user_id);

create policy "Users can insert their own custom rules"
    on public.tracking_custom_rules for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own custom rules"
    on public.tracking_custom_rules for update
    using (auth.uid() = user_id);

create policy "Users can delete their own custom rules"
    on public.tracking_custom_rules for delete
    using (auth.uid() = user_id);
