CREATE TABLE IF NOT EXISTS public.tracking_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT 'hsl(var(--chart-1))',
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS public.tracking_domain_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  domain text NOT NULL,
  category_id uuid REFERENCES public.tracking_categories(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, domain)
);

ALTER TABLE public.tracking_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_domain_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their tracking_categories" ON public.tracking_categories;
CREATE POLICY "Users can manage their tracking_categories" ON public.tracking_categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their tracking_domain_categories" ON public.tracking_domain_categories;
CREATE POLICY "Users can manage their tracking_domain_categories" ON public.tracking_domain_categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.visited_urls ADD COLUMN IF NOT EXISTS is_in_app boolean DEFAULT false;

-- Seed default categories for existing/new users lazily via triggers/functions, or just rely on fallback.
-- Update get_tracking_analytics to use these tables

CREATE OR REPLACE FUNCTION get_tracking_analytics(
  p_user_id uuid,
  p_start_date timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_visits bigint;
  v_unique_domains bigint;
  v_focus_score numeric;
  v_top_domains jsonb;
  v_categories jsonb;
  v_productive_count bigint := 0;
  v_distracting_count bigint := 0;
BEGIN
  -- 1. Calculate Total Visits and Unique Domains
  SELECT 
    COUNT(*), 
    COUNT(DISTINCT (SUBSTRING(url FROM '^(?:https?://)?(?:www\.)?([^/]+)')))
  INTO 
    v_total_visits, 
    v_unique_domains
  FROM visited_urls
  WHERE user_id = p_user_id
    AND visited_at >= p_start_date;

  IF v_total_visits = 0 THEN
    RETURN jsonb_build_object(
      'totalVisits', 0,
      'uniqueDomains', 0,
      'focusScore', 0,
      'topDomains', '[]'::jsonb,
      'categories', '[]'::jsonb
    );
  END IF;

  -- 2. Build Categories Array using custom tables with fallback to Other / Hardcoded
  WITH domain_stats AS (
    SELECT 
      SUBSTRING(v.url FROM '^(?:https?://)?(?:www\.)?([^/]+)') AS domain,
      COUNT(*) AS visit_count
    FROM visited_urls v
    WHERE v.user_id = p_user_id AND v.visited_at >= p_start_date
    GROUP BY 1
  ),
  categorized AS (
    SELECT 
      ds.domain,
      ds.visit_count,
      COALESCE(c.name,
        CASE
          WHEN ds.domain ILIKE ANY(ARRAY['%udemy%', '%coursera%', '%edx%', '%khan%', '%stackoverflow%', '%github%', '%documentation%', '%docs%', '%tutorial%', '%learning%']) THEN 'Education'
          WHEN ds.domain ILIKE ANY(ARRAY['%gmail%', '%outlook%', '%slack%', '%teams%', '%jira%', '%asana%', '%notion%', '%linear%', '%figma%', '%vercel%']) THEN 'Work'
          WHEN ds.domain ILIKE ANY(ARRAY['%facebook%', '%twitter%', '%instagram%', '%reddit%', '%linkedin%', '%tiktok%', '%snapchat%', '%whatsapp%']) THEN 'Social'
          WHEN ds.domain ILIKE ANY(ARRAY['%youtube%', '%netflix%', '%spotify%', '%twitch%', '%gaming%', '%hulu%', '%prime%', '%disney%']) THEN 'Entertainment'
          WHEN ds.domain ILIKE ANY(ARRAY['%news%', '%bbc%', '%cnn%', '%nytimes%', '%guardian%', '%reuters%', '%medium%', '%blog%']) THEN 'News'
          ELSE 'Other'
        END
      ) as category_name,
      COALESCE(c.color,
        CASE
          WHEN ds.domain ILIKE ANY(ARRAY['%udemy%', '%coursera%', '%edx%', '%khan%', '%stackoverflow%', '%github%', '%documentation%', '%docs%', '%tutorial%', '%learning%']) THEN 'hsl(var(--chart-1))'
          WHEN ds.domain ILIKE ANY(ARRAY['%gmail%', '%outlook%', '%slack%', '%teams%', '%jira%', '%asana%', '%notion%', '%linear%', '%figma%', '%vercel%']) THEN 'hsl(var(--chart-2))'
          WHEN ds.domain ILIKE ANY(ARRAY['%facebook%', '%twitter%', '%instagram%', '%reddit%', '%linkedin%', '%tiktok%', '%snapchat%', '%whatsapp%']) THEN 'hsl(var(--chart-3))'
          WHEN ds.domain ILIKE ANY(ARRAY['%youtube%', '%netflix%', '%spotify%', '%twitch%', '%gaming%', '%hulu%', '%prime%', '%disney%']) THEN 'hsl(var(--chart-4))'
          WHEN ds.domain ILIKE ANY(ARRAY['%news%', '%bbc%', '%cnn%', '%nytimes%', '%guardian%', '%reuters%', '%medium%', '%blog%']) THEN 'hsl(var(--chart-5))'
          ELSE 'hsl(var(--muted-foreground))'
        END
      ) as category_color
    FROM domain_stats ds
    LEFT JOIN tracking_domain_categories tdc ON tdc.domain = ds.domain AND tdc.user_id = p_user_id
    LEFT JOIN tracking_categories c ON c.id = tdc.category_id
  ),
  aggregated_categories AS (
    SELECT 
      category_name,
      category_color,
      SUM(visit_count) as total_count
    FROM categorized
    GROUP BY category_name, category_color
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'category', category_name,
      'count', total_count,
      'percentage', (total_count::numeric / v_total_visits::numeric) * 100,
      'color', category_color
    )
  ), '[]'::jsonb)
  INTO v_categories
  FROM aggregated_categories;

  -- 3. Calculate Focus Score (Education + Work)
  SELECT 
    COALESCE(SUM(total_count) FILTER (WHERE category_name IN ('Education', 'Work')), 0),
    COALESCE(SUM(total_count) FILTER (WHERE category_name IN ('Entertainment', 'Social')), 0)
  INTO 
    v_productive_count,
    v_distracting_count
  FROM (
    SELECT 
      category_name,
      SUM(visit_count) as total_count
    FROM categorized
    GROUP BY category_name
  ) sub;

  IF (v_productive_count + v_distracting_count) > 0 THEN
    v_focus_score := ROUND((v_productive_count::numeric / (v_productive_count + v_distracting_count)::numeric) * 100, 0);
  ELSE
    v_focus_score := 0;
  END IF;

  -- 4. Get Top Domains
  SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb)
  INTO v_top_domains
  FROM (
    SELECT 
      domain,
      visit_count as count,
      (visit_count::numeric / v_total_visits::numeric) * 100 as percentage
    FROM domain_stats
    ORDER BY visit_count DESC
    LIMIT 10
  ) sub;

  RETURN jsonb_build_object(
    'totalVisits', v_total_visits,
    'uniqueDomains', v_unique_domains,
    'focusScore', v_focus_score,
    'topDomains', v_top_domains,
    'categories', v_categories
  );
END;
$$;
