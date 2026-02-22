-- Relax body length constraint to allow empty bodies
ALTER TABLE public.vision_notes 
DROP CONSTRAINT IF EXISTS vision_notes_body_check;

ALTER TABLE public.vision_notes 
ADD CONSTRAINT vision_notes_body_check 
CHECK (char_length(body) BETWEEN 0 AND 10000);
