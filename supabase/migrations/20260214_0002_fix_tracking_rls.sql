-- Fix RLS for video tracking updates
-- The extension runs as 'anon', so it needs UPDATE permission on visited_urls

GRANT UPDATE ON TABLE public.visited_urls TO anon;

-- Policy to allow anon role to update rows
-- Since the extension doesn't have user context during update (it uses the ID returned from insert),
-- we allow updating any row if you know the ID.
-- Ideally we'd check user_id, but the extension is unauthenticated in this context.
-- A stricter policy would be to check if the new data is valid, etc.
-- For now, allow update to enable the feature.

create policy "Allow tracking updates via extension"
on public.visited_urls
for update
using (true)
with check (true);
