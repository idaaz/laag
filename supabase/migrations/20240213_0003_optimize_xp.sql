-- Migration: Create RPC function for XP summary (optimized)

-- Create a function to calculate total and today's XP on the server
-- This avoids fetching thousands of rows to the client
CREATE OR REPLACE FUNCTION get_user_xp_summary(target_user_id UUID, today_start TIMESTAMPTZ)
RETURNS TABLE (total_xp BIGINT, today_xp BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(delta_xp), 0) AS total_xp,
        COALESCE(SUM(CASE WHEN created_at >= today_start THEN delta_xp ELSE 0 END), 0) AS today_xp
    FROM xp_events
    WHERE user_id = target_user_id;
END;
$$;
