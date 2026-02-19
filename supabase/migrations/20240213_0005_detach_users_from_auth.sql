-- Migration: Detach public.users from auth.users (allow users without Auth)

-- Drop the foreign key constraint that forces users.id to reference auth.users.id
-- This allows us to insert mock users directly into the public schema.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Also update existing tables to remove 'default auth.uid()' just in case,
-- preventing confusion or errors if rows are inserted without user_id.
-- (Though our application code explicitly provides user_id).
ALTER TABLE public.tasks ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.habits ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.daily_logs ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.relapse_logs ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.xp_events ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.notifications ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.timers ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.screen_logs ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.discipline_snapshots ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.achievements ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.settings ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.themes ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.unlocks ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.habit_questions ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.habit_completion_answers ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.analytics_cache ALTER COLUMN user_id DROP DEFAULT;
