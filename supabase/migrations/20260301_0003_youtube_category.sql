-- Add youtube_category column to visited_urls table
ALTER TABLE public.visited_urls
ADD COLUMN youtube_category text;
