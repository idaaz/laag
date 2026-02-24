-- Migration: Add is_in_app column to visited_urls
-- Tracks whether the visit was made through the in-app IframeViewer

ALTER TABLE visited_urls
  ADD COLUMN IF NOT EXISTS is_in_app BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for fast filtering of in-app visits
CREATE INDEX IF NOT EXISTS idx_visited_urls_is_in_app
  ON visited_urls (user_id, is_in_app)
  WHERE is_in_app = TRUE;

COMMENT ON COLUMN visited_urls.is_in_app IS
  'True if the URL was opened via the in-app IframeViewer on the Tracking page';
