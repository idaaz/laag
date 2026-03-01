-- Add YouTube metadata columns to visited_urls
ALTER TABLE visited_urls
ADD COLUMN IF NOT EXISTS channel_name TEXT,
ADD COLUMN IF NOT EXISTS total_duration_seconds INTEGER;
