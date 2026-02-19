-- Migration: Update habit_questions answer_type constraint to include 'link' and 'time'

DO $$ 
BEGIN 
    -- Cleanup existing data to match the new constraint
    UPDATE habit_questions SET answer_type = 'clock_timer' WHERE answer_type = 'time';

    ALTER TABLE habit_questions DROP CONSTRAINT IF EXISTS habit_questions_answer_type_check;
    ALTER TABLE habit_questions ADD CONSTRAINT habit_questions_answer_type_check CHECK (answer_type IN ('text', 'number', 'percentage', 'link', 'clock_timer', 'counting_timer', 'dropdown', 'checkbox', 'radio', 'file', 'listing'));
END $$;
