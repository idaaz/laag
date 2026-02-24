ALTER TABLE public.habits 
ADD COLUMN IF NOT EXISTS time_of_day TEXT DEFAULT 'anytime' 
CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'night', 'anytime'));

ALTER TABLE public.habits
ADD COLUMN IF NOT EXISTS specific_time TEXT;
