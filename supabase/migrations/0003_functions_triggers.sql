create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.enforce_daily_log_truth()
returns trigger
language plpgsql
as $$
declare
  user_tz text := 'UTC';
  local_today date;
begin
  select coalesce(u.timezone, 'UTC') into user_tz
  from public.users u
  where u.id = new.user_id;

  local_today := (timezone(user_tz, now()))::date;

  if new.log_date < local_today and coalesce(new.edit_reason, '') = '' then
    raise exception 'Retroactive daily log edits require edit_reason.';
  end if;

  if new.log_date < local_today then
    new.retro_edit_flag = true;
  end if;

  if new.study_minutes > 240
     or (new.study_minutes + coalesce(new.workout_minutes, 0)) > 600
     or (
       (new.study_minutes + coalesce(new.workout_minutes, 0))
       > (
         coalesce(
           (
             select avg(dl.study_minutes + dl.workout_minutes)
             from public.daily_logs dl
             where dl.user_id = new.user_id
               and dl.log_date >= (new.log_date - interval '7 day')::date
               and dl.log_date < new.log_date
           ),
           0
         ) * 2
       )
     ) then
    insert into public.notifications (
      user_id,
      type,
      tone,
      title,
      body,
      scheduled_for,
      escalation_level,
      related_entity_type
    )
    values (
      new.user_id,
      'relapse_alert',
      'brutal',
      'Suspicious spike detected',
      'Daily log exceeds normal range and was flagged for review.',
      timezone('utc', now()),
      1,
      'daily_log'
    );
  end if;

  return new;
end;
$$;

create or replace function public.increment_truth_mode_count()
returns trigger
language plpgsql
as $$
declare
  old_reason text := '';
begin
  if tg_op <> 'INSERT' then
    if tg_table_name = 'tasks' then
      old_reason := coalesce(old.override_reason, '');
    elsif tg_table_name = 'daily_logs' then
      old_reason := coalesce(old.edit_reason, '');
    end if;
  end if;

  if tg_table_name = 'tasks' then
    if new.override_reason is not null
       and coalesce(new.override_reason, '') <> ''
       and old_reason <> coalesce(new.override_reason, '') then
      update public.users
      set truth_mode_count = truth_mode_count + 1
      where id = new.user_id;
    end if;
  elsif tg_table_name = 'daily_logs' then
    if new.edit_reason is not null
       and coalesce(new.edit_reason, '') <> ''
       and old_reason <> coalesce(new.edit_reason, '') then
      update public.users
      set truth_mode_count = truth_mode_count + 1
      where id = new.user_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

drop trigger if exists habits_updated_at on public.habits;
create trigger habits_updated_at
before update on public.habits
for each row execute function public.set_updated_at();

drop trigger if exists daily_logs_updated_at on public.daily_logs;
create trigger daily_logs_updated_at
before update on public.daily_logs
for each row execute function public.set_updated_at();

drop trigger if exists settings_updated_at on public.settings;
create trigger settings_updated_at
before update on public.settings
for each row execute function public.set_updated_at();

drop trigger if exists daily_logs_truth_guard on public.daily_logs;
create trigger daily_logs_truth_guard
before insert or update on public.daily_logs
for each row execute function public.enforce_daily_log_truth();

drop trigger if exists tasks_truth_counter on public.tasks;
create trigger tasks_truth_counter
after insert or update on public.tasks
for each row execute function public.increment_truth_mode_count();

drop trigger if exists daily_logs_truth_counter on public.daily_logs;
create trigger daily_logs_truth_counter
after insert or update on public.daily_logs
for each row execute function public.increment_truth_mode_count();
