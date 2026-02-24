-- Update get_tracking_analytics to include In-App Tracking category
-- and better handle other categories

create or replace function get_tracking_analytics(
  p_user_id uuid,
  p_start_date timestamptz
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_total_visits bigint;
  v_unique_domains bigint;
  v_focus_score numeric;
  v_top_domains jsonb;
  v_categories jsonb;
  v_education_count bigint;
  v_work_count bigint;
  v_social_count bigint;
  v_entertainment_count bigint;
  v_news_count bigint;
  v_in_app_count bigint;
  v_other_count bigint;
  v_productive_count bigint;
  v_distracting_count bigint;
begin
  -- 1. Calculate Total Visits and Unique Domains
  select 
    count(*), 
    count(distinct (substring(url from '^(?:https?://)?([^/]+)')))
  into 
    v_total_visits, 
    v_unique_domains
  from visited_urls
  where user_id = p_user_id
    and visited_at >= p_start_date;

  if v_total_visits = 0 then
    return jsonb_build_object(
      'totalVisits', 0,
      'uniqueDomains', 0,
      'focusScore', 0,
      'topDomains', '[]'::jsonb,
      'categories', '[]'::jsonb
    );
  end if;

  -- 2. Calculate Category Counts
  select
    count(*) filter (where url ilike any(array['%udemy%', '%coursera%', '%edx%', '%khan%', '%stackoverflow%', '%github%', '%documentation%', '%docs%', '%tutorial%', '%learning%'])),
    count(*) filter (where url ilike any(array['%gmail%', '%outlook%', '%slack%', '%teams%', '%jira%', '%asana%', '%notion%', '%linear%', '%figma%', '%vercel%'])),
    count(*) filter (where url ilike any(array['%facebook%', '%twitter%', '%instagram%', '%reddit%', '%linkedin%', '%tiktok%', '%snapchat%', '%whatsapp%'])),
    count(*) filter (where url ilike any(array['%youtube%', '%netflix%', '%spotify%', '%twitch%', '%gaming%', '%hulu%', '%prime%', '%disney%'])),
    count(*) filter (where url ilike any(array['%news%', '%bbc%', '%cnn%', '%nytimes%', '%guardian%', '%reuters%', '%medium%', '%blog%'])),
    count(*) filter (where is_in_app = true)
  into
    v_education_count,
    v_work_count,
    v_social_count,
    v_entertainment_count,
    v_news_count,
    v_in_app_count
  from visited_urls
  where user_id = p_user_id
    and visited_at >= p_start_date;

  v_other_count := v_total_visits - (v_education_count + v_work_count + v_social_count + v_entertainment_count + v_news_count + v_in_app_count);
  if v_other_count < 0 then v_other_count := 0; end if;

  -- 3. Calculate Focus Score
  v_productive_count := v_education_count + v_work_count + v_in_app_count; -- In-App is productive!
  v_distracting_count := v_entertainment_count + v_social_count;
  
  if (v_productive_count + v_distracting_count) > 0 then
    v_focus_score := round((v_productive_count::numeric / (v_productive_count + v_distracting_count)::numeric) * 100, 0);
  else
    v_focus_score := 0;
  end if;

  -- 4. Get Top Domains
  select jsonb_agg(sub)
  into v_top_domains
  from (
    select 
      substring(url from '^(?:https?://)?(?:www\.)?([^/]+)') as domain,
      count(*) as count,
      (count(*)::numeric / v_total_visits::numeric) * 100 as percentage
    from visited_urls
    where user_id = p_user_id
      and visited_at >= p_start_date
    group by 1
    order by 2 desc
    limit 10
  ) sub;

  -- 5. Build Categories Array
  v_categories := jsonb_build_array(
    jsonb_build_object('category', 'Education', 'count', v_education_count, 'percentage', (v_education_count::numeric / v_total_visits) * 100, 'color', 'hsl(var(--k-teal))'),
    jsonb_build_object('category', 'Work', 'count', v_work_count, 'percentage', (v_work_count::numeric / v_total_visits) * 100, 'color', 'hsl(var(--k-blue))'),
    jsonb_build_object('category', 'In-App Tracking', 'count', v_in_app_count, 'percentage', (v_in_app_count::numeric / v_total_visits) * 100, 'color', 'hsl(var(--k-gold))'),
    jsonb_build_object('category', 'Social', 'count', v_social_count, 'percentage', (v_social_count::numeric / v_total_visits) * 100, 'color', 'hsl(var(--k-red))'),
    jsonb_build_object('category', 'Entertainment', 'count', v_entertainment_count, 'percentage', (v_entertainment_count::numeric / v_total_visits) * 100, 'color', 'hsl(var(--k-orange))'),
    jsonb_build_object('category', 'News', 'count', v_news_count, 'percentage', (v_news_count::numeric / v_total_visits) * 100, 'color', 'hsl(var(--k-indigo))'),
    jsonb_build_object('category', 'Other', 'count', v_other_count, 'percentage', (v_other_count::numeric / v_total_visits) * 100, 'color', 'hsl(var(--muted))', 'isOther', true)
  );

  return jsonb_build_object(
    'totalVisits', v_total_visits,
    'uniqueDomains', v_unique_domains,
    'focusScore', v_focus_score,
    'topDomains', coalesce(v_top_domains, '[]'::jsonb),
    'categories', v_categories
  );
end;
$$;
