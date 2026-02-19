-- Disable RLS on vision_notes to allow Open Access saves
ALTER TABLE public.vision_notes DISABLE ROW LEVEL SECURITY;

-- Optional: Add public access policy as a fallback
DROP POLICY IF EXISTS "Public Access" ON public.vision_notes;
CREATE POLICY "Public Access" ON public.vision_notes FOR ALL USING (true);
