-- Migration to remove vision_pillar from vision_notes
ALTER TABLE public.vision_notes DROP COLUMN IF EXISTS vision_pillar;
