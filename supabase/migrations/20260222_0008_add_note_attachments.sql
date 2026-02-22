-- ABSOLUTE FINAL RLS RESET FOR STORAGE
-- Please copy and paste this entire script into your Supabase SQL Editor and click RUN.

-- 1. Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('note-attachments', 'note-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Bruteforce drop of ANY our previous policies
DROP POLICY IF EXISTS "Authenticated users can upload note attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own note attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own note attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public can view note attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own note attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner update" ON storage.objects;
DROP POLICY IF EXISTS "Nuclear Upload" ON storage.objects;
DROP POLICY IF EXISTS "Nuclear Select" ON storage.objects;
DROP POLICY IF EXISTS "Nuclear Delete" ON storage.objects;
DROP POLICY IF EXISTS "Nuclear Update" ON storage.objects;
DROP POLICY IF EXISTS "Testing Open Access" ON storage.objects;

-- 3. Unconditional Access Policies
-- These policies apply to ALL roles (authenticated, anon, etc) and allow any action within the bucket.
CREATE POLICY "Universal Insert note_attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'note-attachments');
CREATE POLICY "Universal Select note_attachments" ON storage.objects FOR SELECT USING (bucket_id = 'note-attachments');
CREATE POLICY "Universal Update note_attachments" ON storage.objects FOR UPDATE USING (bucket_id = 'note-attachments');
CREATE POLICY "Universal Delete note_attachments" ON storage.objects FOR DELETE USING (bucket_id = 'note-attachments');
