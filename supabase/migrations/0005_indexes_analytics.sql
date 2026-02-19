create index if not exists idx_tasks_user_created_at
  on public.tasks (user_id, created_at desc);

create index if not exists idx_habits_user_created_at
  on public.habits (user_id, created_at desc);

create index if not exists idx_xp_events_user_created_at
  on public.xp_events (user_id, created_at desc);

create index if not exists idx_notifications_user_created_at
  on public.notifications (user_id, created_at desc);

create index if not exists idx_timers_user_created_at
  on public.timers (user_id, created_at desc);

create index if not exists idx_daily_logs_user_log_date
  on public.daily_logs (user_id, log_date desc);

create index if not exists idx_screen_logs_user_log_date
  on public.screen_logs (user_id, log_date desc);

create index if not exists idx_discipline_snapshots_user_snapshot_date
  on public.discipline_snapshots (user_id, snapshot_date desc);

create index if not exists idx_tasks_user_deadline_open
  on public.tasks (user_id, deadline_at)
  where status <> 'completed';

create index if not exists idx_notifications_user_unread
  on public.notifications (user_id, read_at)
  where read_at is null;

create index if not exists idx_analytics_cache_payload_gin
  on public.analytics_cache using gin (payload);

-- Daily XP totals by date range
-- select date_trunc('day', created_at)::date as day, sum(delta_xp) as xp_total
-- from public.xp_events
-- where user_id = $1 and created_at >= $2 and created_at < $3
-- group by 1
-- order by 1;

-- Weekly XP totals
-- select date_trunc('week', created_at)::date as week_start, sum(delta_xp) as xp_total
-- from public.xp_events
-- where user_id = $1 and created_at >= $2 and created_at < $3
-- group by 1
-- order by 1;

-- Monthly XP totals
-- select date_trunc('month', created_at)::date as month_start, sum(delta_xp) as xp_total
-- from public.xp_events
-- where user_id = $1 and created_at >= $2 and created_at < $3
-- group by 1
-- order by 1;

-- Habit streak calculation (gaps and islands)
-- with days as (
--   select distinct user_id, habit_id, relapse_at::date as activity_day
--   from public.relapse_logs
--   where user_id = $1 and habit_id = $2
-- ),
-- ranked as (
--   select activity_day,
--          activity_day - row_number() over (order by activity_day)::int as grp
--   from days
-- )
-- select min(activity_day) as streak_start,
--        max(activity_day) as streak_end,
--        count(*) as streak_days
-- from ranked
-- group by grp
-- order by streak_end desc;

-- Heatmap (fills empty days with 0 activity)
-- with calendar as (
--   select generate_series($2::date, $3::date, interval '1 day')::date as day
-- ),
-- xp as (
--   select created_at::date as day, sum(delta_xp) as xp_total
--   from public.xp_events
--   where user_id = $1 and created_at::date between $2::date and $3::date
--   group by 1
-- )
-- select c.day, coalesce(xp.xp_total, 0) as xp_total
-- from calendar c
-- left join xp on xp.day = c.day
-- order by c.day;

-- Screen time vs study time
-- select dl.log_date as day,
--        dl.study_minutes,
--        coalesce(sum(sl.minutes), 0) as screen_minutes
-- from public.daily_logs dl
-- left join public.screen_logs sl
--   on sl.user_id = dl.user_id and sl.log_date = dl.log_date
-- where dl.user_id = $1 and dl.log_date between $2::date and $3::date
-- group by dl.log_date, dl.study_minutes
-- order by dl.log_date;

-- Burnout proxy
-- select dl.log_date as day,
--        greatest(0, (6.5 - dl.sleep_hours) * 18 + (dl.study_minutes / 60.0) * 7 + (dl.screen_minutes / 60.0) * 6) as burnout_index
-- from public.daily_logs dl
-- where dl.user_id = $1 and dl.log_date between $2::date and $3::date
-- order by dl.log_date;

-- Overconfidence proxy
-- with completions as (
--   select completed_at::date as day, count(*) as completed_tasks
--   from public.tasks
--   where user_id = $1 and status = 'completed' and completed_at::date between $2::date and $3::date
--   group by 1
-- )
-- select dl.log_date as day,
--        greatest(0, dl.productivity * 10 - coalesce(c.completed_tasks, 0) * 12) as overconfidence_index
-- from public.daily_logs dl
-- left join completions c on c.day = dl.log_date
-- where dl.user_id = $1 and dl.log_date between $2::date and $3::date
-- order by dl.log_date;
