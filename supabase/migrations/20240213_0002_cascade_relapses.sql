-- Migration: Update relapse_logs to CASCADE DELETE on habit deletion

DO $$ 
BEGIN 
    -- Drop the existing constraint
    ALTER TABLE public.relapse_logs DROP CONSTRAINT IF EXISTS relapse_logs_habit_id_fkey;

    -- Re-add it with ON DELETE CASCADE
    ALTER TABLE public.relapse_logs 
    ADD CONSTRAINT relapse_logs_habit_id_fkey 
    FOREIGN KEY (habit_id) 
    REFERENCES public.habits(id) 
    ON DELETE CASCADE;
END $$;
