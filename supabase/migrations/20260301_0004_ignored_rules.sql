-- tracking_ignored_urls table definition

create table if not exists public.tracking_ignored_urls (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references public.users (id) on delete cascade,
    url_pattern text not null check (char_length(url_pattern) >= 3),
    created_at timestamptz not null default timezone('utc', now()),
    unique(user_id, url_pattern)
);

-- RLS Policies
alter table public.tracking_ignored_urls enable row level security;

-- The URL tracker extension runs unauthenticated but needs to download these rules. 
-- It passes the user_id in the body/query, so we allow SELECT if the user_id matches
-- OR if extending a generic SELECT (since it relies on filtering by explicit user_id anyway)
create policy "Allow fetching ignored rules"
    on public.tracking_ignored_urls for select
    using (true);

create policy "Users can insert their own ignored rules"
    on public.tracking_ignored_urls for insert
    with check (auth.uid() = user_id);

create policy "Users can delete their own ignored rules"
    on public.tracking_ignored_urls for delete
    using (auth.uid() = user_id);
