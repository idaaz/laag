-- Add missing note types to the check constraint
ALTER TABLE public.vision_notes 
DROP CONSTRAINT IF EXISTS vision_notes_note_type_check;

ALTER TABLE public.vision_notes 
ADD CONSTRAINT vision_notes_note_type_check 
CHECK (note_type IN ('thought', 'idea', 'decision', 'risk', 'question', 'milestone', 'insight', 'information', 'secret'));
