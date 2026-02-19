-- Add columns for video tracking
ALTER TABLE public.visited_urls
ADD COLUMN IF NOT EXISTS watch_time_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_start_time NUMERIC,
ADD COLUMN IF NOT EXISTS video_end_time NUMERIC;

-- Comment on columns for clarity
COMMENT ON COLUMN public.visited_urls.watch_time_seconds IS 'Actual wall-clock time spent watching the video in seconds';
COMMENT ON COLUMN public.visited_urls.video_start_time IS 'Video timestamp (seconds) where playback started';
COMMENT ON COLUMN public.visited_urls.video_end_time IS 'Video timestamp (seconds) where playback ended';
