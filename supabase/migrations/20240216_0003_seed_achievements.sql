-- Seed achievement definitions
-- This migration populates the achievement_definitions table with initial achievements

-- ============================================================================
-- TASK MASTER ACHIEVEMENTS
-- ============================================================================

insert into public.achievement_definitions (code, title, description, category, tier, icon_name, unlock_condition, xp_reward, display_order) values
  ('task_first_steps', 'First Steps', 'Complete your first task', 'tasks', 'bronze', 'check-circle', '{"type":"count","metric":"tasks_completed","comparison":">=","target":1}', 25, 1),
  ('task_warrior_bronze', 'Task Warrior', 'Complete 10 tasks', 'tasks', 'bronze', 'sword', '{"type":"count","metric":"tasks_completed","comparison":">=","target":10}', 50, 2),
  ('task_warrior_silver', 'Task Warrior II', 'Complete 50 tasks', 'tasks', 'silver', 'sword', '{"type":"count","metric":"tasks_completed","comparison":">=","target":50}', 100, 3),
  ('task_warrior_gold', 'Task Warrior III', 'Complete 100 tasks', 'tasks', 'gold', 'sword', '{"type":"count","metric":"tasks_completed","comparison":">=","target":100}', 200, 4),
  ('task_warrior_platinum', 'Task Warrior IV', 'Complete 500 tasks', 'tasks', 'platinum', 'sword', '{"type":"count","metric":"tasks_completed","comparison":">=","target":500}', 500, 5),
  ('speed_runner', 'Speed Runner', 'Complete 5 tasks in one day', 'tasks', 'silver', 'zap', '{"type":"count","metric":"tasks_completed_today","comparison":">=","target":5}', 75, 6),
  ('priority_pro', 'Priority Pro', 'Complete 10 high-priority tasks', 'tasks', 'silver', 'alert-circle', '{"type":"count","metric":"high_priority_tasks_completed","comparison":">=","target":10}', 75, 7),
  ('deadline_keeper', 'Deadline Keeper', 'Complete 10 tasks before deadline', 'tasks', 'gold', 'clock', '{"type":"count","metric":"before_deadline_completions","comparison":">=","target":10}', 100, 8),
  ('late_night_grind', 'Late Night Grind', 'Complete a task after 11 PM', 'tasks', 'bronze', 'moon', '{"type":"count","metric":"late_night_completions","comparison":">=","target":1}', 30, 9),
  ('early_bird', 'Early Bird', 'Complete a task before 7 AM', 'tasks', 'bronze', 'sunrise', '{"type":"count","metric":"early_morning_completions","comparison":">=","target":1}', 30, 10);

-- ============================================================================
-- HABIT HERO ACHIEVEMENTS
-- ============================================================================

insert into public.achievement_definitions (code, title, description, category, tier, icon_name, unlock_condition, xp_reward, display_order) values
  ('habit_starter', 'Habit Starter', 'Create your first habit', 'habits', 'bronze', 'plus-circle', '{"type":"count","metric":"habits_created","comparison":">=","target":1}', 25, 11),
  ('consistency_king_bronze', 'Consistency King', 'Maintain a 7-day habit streak', 'habits', 'bronze', 'flame', '{"type":"streak","metric":"habit_max_streak","comparison":">=","target":7}', 50, 12),
  ('consistency_king_silver', 'Consistency King II', 'Maintain a 30-day habit streak', 'habits', 'silver', 'flame', '{"type":"streak","metric":"habit_max_streak","comparison":">=","target":30}', 100, 13),
  ('consistency_king_gold', 'Consistency King III', 'Maintain a 100-day habit streak', 'habits', 'gold', 'flame', '{"type":"streak","metric":"habit_max_streak","comparison":">=","target":100}', 300, 14),
  ('consistency_king_platinum', 'Consistency King IV', 'Maintain a 365-day habit streak', 'habits', 'platinum', 'flame', '{"type":"streak","metric":"habit_max_streak","comparison":">=","target":365}', 1000, 15),
  ('habit_collector', 'Habit Collector', 'Track 5 active habits simultaneously', 'habits', 'silver', 'layers', '{"type":"count","metric":"active_habits","comparison":">=","target":5}', 75, 16),
  ('perfect_week', 'Perfect Week', 'Complete all habits for 7 consecutive days', 'habits', 'gold', 'calendar-check', '{"type":"complex","metric":"perfect_habit_week","comparison":">=","target":1}', 150, 17),
  ('relapse_recovery', 'Comeback Champion', 'Rebuild a streak after 3 relapses', 'habits', 'silver', 'trending-up', '{"type":"count","metric":"relapse_recoveries","comparison":">=","target":3}', 100, 18);

-- ============================================================================
-- PRODUCTIVITY GENIUS ACHIEVEMENTS
-- ============================================================================

insert into public.achievement_definitions (code, title, description, category, tier, icon_name, unlock_condition, xp_reward, display_order) values
  ('xp_hunter', 'XP Hunter', 'Earn your first XP', 'productivity', 'bronze', 'star', '{"type":"count","metric":"total_xp","comparison":">=","target":1}', 10, 19),
  ('level_up_bronze', 'Level Up', 'Earn 100 total XP', 'productivity', 'bronze', 'award', '{"type":"count","metric":"total_xp","comparison":">=","target":100}', 50, 20),
  ('level_up_silver', 'Level Up II', 'Earn 1000 total XP', 'productivity', 'silver', 'award', '{"type":"count","metric":"total_xp","comparison":">=","target":1000}', 150, 21),
  ('level_up_gold', 'Level Up III', 'Earn 10000 total XP', 'productivity', 'gold', 'award', '{"type":"count","metric":"total_xp","comparison":">=","target":10000}', 500, 22),
  ('level_up_platinum', 'Level Up IV', 'Earn 50000 total XP', 'productivity', 'platinum', 'award', '{"type":"count","metric":"total_xp","comparison":">=","target":50000}', 1500, 23),
  ('pomodoro_pro_bronze', 'Pomodoro Pro', 'Complete 10 pomodoro sessions', 'productivity', 'bronze', 'timer', '{"type":"count","metric":"pomodoro_completions","comparison":">=","target":10}', 50, 24),
  ('pomodoro_pro_silver', 'Pomodoro Pro II', 'Complete 50 pomodoro sessions', 'productivity', 'silver', 'timer', '{"type":"count","metric":"pomodoro_completions","comparison":">=","target":50}', 100, 25),
  ('pomodoro_pro_gold', 'Pomodoro Pro III', 'Complete 200 pomodoro sessions', 'productivity', 'gold', 'timer', '{"type":"count","metric":"pomodoro_completions","comparison":">=","target":200}', 300, 26),
  ('daily_grind', 'Daily Grind', 'Earn 100+ XP in a single day', 'productivity', 'silver', 'trending-up', '{"type":"threshold","metric":"xp_in_one_day","comparison":">=","target":100}', 100, 27),
  ('weekly_warrior', 'Weekly Warrior', 'Earn 500+ XP in a week', 'productivity', 'gold', 'activity', '{"type":"threshold","metric":"xp_in_one_week","comparison":">=","target":500}', 200, 28);

-- ============================================================================
-- ANALYTICS ACE ACHIEVEMENTS
-- ============================================================================

insert into public.achievement_definitions (code, title, description, category, tier, icon_name, unlock_condition, xp_reward, display_order) values
  ('data_enthusiast', 'Data Enthusiast', 'View analytics page 10 times', 'analytics', 'bronze', 'bar-chart-3', '{"type":"count","metric":"analytics_views","comparison":">=","target":10}', 30, 29),
  ('balanced_life', 'Balanced Life', 'Achieve all 5 life domains above 70', 'analytics', 'gold', 'hexagon', '{"type":"complex","metric":"all_radar_above_70","comparison":">=","target":1}', 200, 30),
  ('focus_champion', 'Focus Champion', 'Achieve 80%+ focus score for 7 days', 'analytics', 'gold', 'target', '{"type":"threshold","metric":"focus_score_7d","comparison":">=","target":80,"timeframe":"7d"}', 150, 31),
  ('burnout_avoider', 'Burnout Avoider', 'Keep burnout below 30 for 30 days', 'analytics', 'gold', 'shield', '{"type":"threshold","metric":"burnout_index","comparison":"<=","target":30,"timeframe":"30d"}', 200, 32),
  ('productivity_surge', 'Productivity Surge', 'Achieve 50%+ week-over-week increase', 'analytics', 'silver', 'arrow-up', '{"type":"threshold","metric":"productivity_wow_change","comparison":">=","target":50}', 100, 33);

-- ============================================================================
-- WELLNESS WARRIOR ACHIEVEMENTS
-- ============================================================================

insert into public.achievement_definitions (code, title, description, category, tier, icon_name, unlock_condition, xp_reward, display_order) values
  ('logger', 'Logger', 'Complete your first daily log', 'wellness', 'bronze', 'book-open', '{"type":"count","metric":"daily_logs_completed","comparison":">=","target":1}', 25, 34),
  ('consistent_logger_bronze', 'Consistent Logger', 'Log for 7 consecutive days', 'wellness', 'bronze', 'calendar', '{"type":"streak","metric":"daily_log_streak","comparison":">=","target":7}', 50, 35),
  ('consistent_logger_silver', 'Consistent Logger II', 'Log for 30 consecutive days', 'wellness', 'silver', 'calendar', '{"type":"streak","metric":"daily_log_streak","comparison":">=","target":30}', 150, 36),
  ('consistent_logger_gold', 'Consistent Logger III', 'Log for 100 consecutive days', 'wellness', 'gold', 'calendar', '{"type":"streak","metric":"daily_log_streak","comparison":">=","target":100}', 400, 37),
  ('early_sleeper', 'Early Sleeper', 'Log 8+ hours sleep for 7 nights', 'wellness', 'silver', 'bed', '{"type":"complex","metric":"sleep_8h_7nights","comparison":">=","target":1}', 100, 38),
  ('study_beast', 'Study Beast', 'Log 8+ hours study in one day', 'wellness', 'gold', 'brain', '{"type":"threshold","metric":"study_minutes_one_day","comparison":">=","target":480}', 150, 39),
  ('workout_warrior', 'Workout Warrior', 'Log 60+ workout minutes in one day', 'wellness', 'silver', 'dumbbell', '{"type":"threshold","metric":"workout_minutes_one_day","comparison":">=","target":60}', 75, 40),
  ('screen_detox', 'Screen Detox', 'Log 0 screen time for 3 consecutive days', 'wellness', 'gold', 'smartphone-off', '{"type":"complex","metric":"zero_screen_3days","comparison":">=","target":1}', 150, 41),
  ('perfect_balance', 'Perfect Balance', 'Achieve optimal metrics in all areas (sleep 7-9h, mood/productivity 8+)', 'wellness', 'platinum', 'heart', '{"type":"complex","metric":"perfect_day_log","comparison":">=","target":1}', 250, 42);

-- ============================================================================
-- MILESTONE ACHIEVEMENTS
-- ============================================================================

insert into public.achievement_definitions (code, title, description, category, tier, icon_name, unlock_condition, xp_reward, display_order) values
  ('one_week_strong', 'One Week Strong', 'Use app for 7 consecutive days', 'milestones', 'bronze', 'calendar-days', '{"type":"streak","metric":"app_usage_streak","comparison":">=","target":7}', 50, 43),
  ('monthly_dedication', 'Monthly Dedication', 'Use app for 30 consecutive days', 'milestones', 'silver', 'calendar-range', '{"type":"streak","metric":"app_usage_streak","comparison":">=","target":30}', 150, 44),
  ('yearly_commitment', 'Yearly Commitment', 'Use app for 365 consecutive days', 'milestones', 'platinum', 'calendar-heart', '{"type":"streak","metric":"app_usage_streak","comparison":">=","target":365}', 1000, 45),
  ('century_club', 'Century Club', 'Reach 100 total completed tasks', 'milestones', 'gold', 'hundred-points', '{"type":"count","metric":"tasks_completed","comparison":">=","target":100}', 200, 46),
  ('thousand_steps', 'Thousand Steps', 'Earn 1000 total XP', 'milestones', 'gold', 'footprints', '{"type":"count","metric":"total_xp","comparison":">=","target":1000}', 200, 47),
  ('veteran_user', 'Veteran User', '6 months of active usage', 'milestones', 'platinum', 'medal', '{"type":"threshold","metric":"days_since_signup","comparison":">=","target":180}', 500, 48);

-- ============================================================================
-- SPECIAL & HIDDEN ACHIEVEMENTS
-- ============================================================================

insert into public.achievement_definitions (code, title, description, category, tier, icon_name, unlock_condition, xp_reward, is_hidden, display_order) values
  ('night_owl', 'Night Owl', 'Complete activities between midnight-4 AM on 5 occasions', 'special', 'silver', 'moon-stars', '{"type":"count","metric":"midnight_activities","comparison":">=","target":5}', 100, true, 49),
  ('perfect_day', 'Perfect Day', 'Complete all tasks + all habits + optimal log on same day', 'special', 'platinum', 'sparkles', '{"type":"complex","metric":"perfect_day","comparison":">=","target":1}', 300, false, 50),
  ('comeback_king', 'Comeback King', 'Return to app after 30+ day absence', 'special', 'gold', 'rotate-ccw', '{"type":"complex","metric":"return_after_30days","comparison":">=","target":1}', 150, true, 51),
  ('truth_seeker', 'Truth Seeker', 'Activate Truth Mode 10 times', 'special', 'silver', 'eye', '{"type":"count","metric":"truth_mode_activations","comparison":">=","target":10}', 100, false, 52),
  ('explorer', 'Explorer', 'Visit all pages in the app', 'special', 'bronze', 'map', '{"type":"complex","metric":"all_pages_visited","comparison":">=","target":1}', 50, false, 53);
