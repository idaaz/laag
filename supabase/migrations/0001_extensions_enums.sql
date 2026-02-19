create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_priority') then
    create type public.task_priority as enum ('low', 'medium', 'high', 'critical');
  end if;
  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type public.task_status as enum ('todo', 'in_progress', 'completed', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'screen_log_source') then
    create type public.screen_log_source as enum ('manual', 'extension');
  end if;
  if not exists (select 1 from pg_type where typname = 'timer_session_type') then
    create type public.timer_session_type as enum ('pomodoro', 'short_break', 'long_break', 'deep_work');
  end if;
  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type public.notification_type as enum (
      'task_deadline',
      'habit_reminder',
      'streak_warning',
      'daily_log_reminder',
      'relapse_alert'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'notification_tone') then
    create type public.notification_tone as enum ('motivational', 'brutal', 'mother');
  end if;
  if not exists (select 1 from pg_type where typname = 'unlock_type') then
    create type public.unlock_type as enum ('theme', 'title', 'sound');
  end if;
end $$;
