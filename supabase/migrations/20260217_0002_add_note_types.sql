-- Add new values to the vision_note_type enum
ALTER TYPE vision_note_type ADD VALUE IF NOT EXISTS 'information';
ALTER TYPE vision_note_type ADD VALUE IF NOT EXISTS 'secret';
