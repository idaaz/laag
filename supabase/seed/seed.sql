-- Replace {{USER_ID}} with a real auth.users UUID before running.
-- Example:
--   with seed_user as (select '00000000-0000-0000-0000-000000000000'::uuid as user_id)

begin;

with seed_user as (select '{{USER_ID}}'::uuid as user_id),
upsert_user as (
  insert into public.users (id, email, display_name, timezone)
  select user_id, 'demo@laag.local', 'LAAG Owner', 'America/Los_Angeles'
  from seed_user
  on conflict (id) do update
    set email = excluded.email,
        display_name = excluded.display_name,
        timezone = excluded.timezone
  returning id
)
insert into public.settings (
  user_id,
  xp_rules,
  discipline_rules,
  notification_prefs,
  lock_mode,
  brutal_truth_mode,
  recovery_threshold,
  strictness_profile
)
select
  id,
  '{
    "levelDivisor":100,
    "dailySoftCap":300,
    "softCapMultiplier":0.25,
    "penalties":{"streakBreakBase":25,"highLevelMultiplier":1.4},
    "rewards":{"completeTask":10,"highPriorityBonus":20,"workout":30,"studyPerHour":15,"customHabitDefault":12},
    "screenPenaltyThresholdMinutes":240,
    "screenPenaltyXP":15
  }'::jsonb,
  '{"recoveryThreshold":45,"recoveryDaysRequired":2}'::jsonb,
  '{"browser":true,"inApp":true,"deadlineLeadHours":4,"streakLeadHours":6}'::jsonb,
  '{"enabled":false,"timeoutMinutes":15}'::jsonb,
  true,
  45,
  '{"mode":"adaptive"}'::jsonb
from upsert_user
on conflict (user_id) do nothing;

with seed_user as (select '{{USER_ID}}'::uuid as user_id)
insert into public.tasks (user_id, title, description, priority, status, deadline_at, xp_base, xp_bonus)
select user_id, 'Deep work sprint', 'Two focused pomodoros on core product.', 'high', 'todo', timezone('utc', now()) + interval '8 hour', 10, 20 from seed_user
union all
select user_id, 'Strength training', '45 minutes resistance session.', 'medium', 'todo', timezone('utc', now()) + interval '12 hour', 10, 0 from seed_user
union all
select user_id, 'Ship settings hardening', 'Add lock mode and export guard.', 'critical', 'in_progress', timezone('utc', now()) + interval '1 day', 10, 20 from seed_user;

with seed_user as (select '{{USER_ID}}'::uuid as user_id)
insert into public.habits (user_id, name, frequency_per_week, xp_per_completion, current_streak, longest_streak, last_completed_on)
select user_id, 'Morning deep work', 5, 15, 3, 6, current_date - interval '1 day' from seed_user
union all
select user_id, 'Workout', 4, 20, 2, 5, current_date from seed_user
union all
select user_id, 'No late-night doomscroll', 7, 10, 1, 4, current_date - interval '1 day' from seed_user;

with seed_user as (select '{{USER_ID}}'::uuid as user_id)
insert into public.daily_logs (
  user_id, log_date, study_minutes, workout_minutes, sleep_hours, screen_minutes, mood, productivity, daily_log_completion
)
select user_id, current_date - interval '2 day', 180, 40, 6.8, 210, 6, 7, 1 from seed_user
union all
select user_id, current_date - interval '1 day', 120, 30, 7.4, 260, 6, 6, 1 from seed_user
union all
select user_id, current_date, 90, 20, 7.0, 190, 7, 7, 1 from seed_user
on conflict (user_id, log_date) do nothing;

with seed_user as (select '{{USER_ID}}'::uuid as user_id)
insert into public.relapse_logs (user_id, severity, trigger, notes)
select user_id, 4, 'Late-night scrolling', 'Missed wind-down routine.' from seed_user;

with seed_user as (select '{{USER_ID}}'::uuid as user_id)
insert into public.screen_logs (user_id, log_date, source, minutes)
select user_id, current_date - interval '2 day', 'manual', 210 from seed_user
union all
select user_id, current_date - interval '1 day', 'manual', 260 from seed_user
union all
select user_id, current_date, 'manual', 190 from seed_user
on conflict (user_id, log_date, source) do nothing;

with seed_user as (select '{{USER_ID}}'::uuid as user_id)
insert into public.timers (user_id, session_type, started_at, ended_at, duration_minutes, completed, interruptions, xp_awarded)
select user_id, 'pomodoro', timezone('utc', now()) - interval '3 hour', timezone('utc', now()) - interval '2 hour 35 minute', 25, true, 0, 8 from seed_user
union all
select user_id, 'deep_work', timezone('utc', now()) - interval '1 day', timezone('utc', now()) - interval '23 hour 10 minute', 50, true, 1, 15 from seed_user;

with seed_user as (select '{{USER_ID}}'::uuid as user_id)
insert into public.xp_events (user_id, source_type, delta_xp, reason, capped, decay_applied, tone_used)
select user_id, 'task_complete', 30, 'Completed high priority task', false, false, 'motivational' from seed_user
union all
select user_id, 'habit_complete', 15, 'Morning deep work', false, false, 'motivational' from seed_user
union all
select user_id, 'penalty', -15, 'Screen time threshold exceeded', false, false, 'brutal' from seed_user
union all
select user_id, 'timer_complete', 8, 'Pomodoro finished', false, false, 'motivational' from seed_user;

with seed_user as (select '{{USER_ID}}'::uuid as user_id)
insert into public.notifications (user_id, type, tone, title, body, scheduled_for, escalation_level)
select user_id, 'task_deadline', 'brutal', 'Deadline in 4 hours', 'Deep work sprint is still open.', timezone('utc', now()) + interval '4 hour', 1 from seed_user
union all
select user_id, 'daily_log_reminder', 'mother', 'Daily log pending', 'No excuses. Capture your day before sleep.', timezone('utc', now()) + interval '6 hour', 2 from seed_user;

with seed_user as (select '{{USER_ID}}'::uuid as user_id)
insert into public.achievements (user_id, code, title, description, meta)
select user_id, 'TRUTH_001', 'Truth Initiate', 'Logged first uncomfortable correction.', '{"category":"discipline"}'::jsonb from seed_user
on conflict (user_id, code) do nothing;

with seed_user as (select '{{USER_ID}}'::uuid as user_id)
insert into public.themes (user_id, theme_key, name, palette, is_active)
select user_id, 'ember-steel', 'Ember Steel', '{"background":"#0f1115","primary":"#ef5a29"}'::jsonb, true from seed_user
on conflict (user_id, theme_key) do nothing;

with seed_user as (select '{{USER_ID}}'::uuid as user_id)
insert into public.unlocks (user_id, unlock_type, unlock_key)
select user_id, 'title', 'Truth Apprentice' from seed_user
on conflict (user_id, unlock_type, unlock_key) do nothing;

with seed_user as (select '{{USER_ID}}'::uuid as user_id)
insert into public.discipline_snapshots (
  user_id, snapshot_date, score, completed_tasks, total_tasks, habit_consistency, daily_log_completion, burnout_index, overconfidence_index
)
select user_id, current_date - interval '2 day', 61, 2, 3, 0.67, 1, 42, 18 from seed_user
union all
select user_id, current_date - interval '1 day', 58, 1, 3, 0.5, 1, 49, 24 from seed_user
union all
select user_id, current_date, 66, 2, 3, 0.67, 1, 37, 20 from seed_user
on conflict (user_id, snapshot_date) do nothing;

with seed_user as (select '{{USER_ID}}'::uuid as user_id)
insert into public.analytics_cache (
  user_id, metric_key, period_start, period_end, payload, generated_at, expires_at, cache_version
)
select
  user_id,
  'overview_30d',
  current_date - interval '30 day',
  current_date,
  '{"seeded":true}'::jsonb,
  timezone('utc', now()),
  timezone('utc', now()) + interval '15 minute',
  1
from seed_user
on conflict (user_id, metric_key, period_start, period_end) do nothing;

commit;
