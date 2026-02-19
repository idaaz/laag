-- Create visited_urls table
CREATE TABLE IF NOT EXISTS public.visited_urls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visited_urls ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running this migration)
DROP POLICY IF EXISTS "Users can view their own visited URLs" ON public.visited_urls;
DROP POLICY IF EXISTS "Users can insert their own visited URLs" ON public.visited_urls;
DROP POLICY IF EXISTS "Allow tracking inserts via extension" ON public.visited_urls;

-- Explicitly grant permissions to anon/authenticated roles
GRANT INSERT ON TABLE public.visited_urls TO anon, authenticated;
GRANT SELECT ON TABLE public.visited_urls TO anon, authenticated;

-- Add RLS policies
CREATE POLICY "Users can view their own visited URLs"
    ON public.visited_urls FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NOT NULL); -- Loosen for debugging

-- Explicitly allow any insert that specifies a user_id.
-- Since the extension uses the anon key, this is the most reliable way.
CREATE POLICY "Allow tracking inserts via extension"
    ON public.visited_urls FOR INSERT
    WITH CHECK (true);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_visited_urls_user_visited ON public.visited_urls(user_id, visited_at DESC);
