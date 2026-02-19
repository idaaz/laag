alter table public.users enable row level security;
alter table public.tasks enable row level security;
alter table public.habits enable row level security;
alter table public.daily_logs enable row level security;
alter table public.relapse_logs enable row level security;
alter table public.screen_logs enable row level security;
alter table public.timers enable row level security;
alter table public.xp_events enable row level security;
alter table public.notifications enable row level security;
alter table public.achievements enable row level security;
alter table public.settings enable row level security;
alter table public.themes enable row level security;
alter table public.unlocks enable row level security;
alter table public.discipline_snapshots enable row level security;
alter table public.analytics_cache enable row level security;

drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users for select using (id = auth.uid());
drop policy if exists users_insert_own on public.users;
create policy users_insert_own on public.users for insert with check (id = auth.uid());
drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users for update using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists users_delete_own on public.users;
create policy users_delete_own on public.users for delete using (id = auth.uid());

drop policy if exists tasks_select_own on public.tasks;
create policy tasks_select_own on public.tasks for select using (user_id = auth.uid());
drop policy if exists tasks_insert_own on public.tasks;
create policy tasks_insert_own on public.tasks for insert with check (user_id = auth.uid());
drop policy if exists tasks_update_own on public.tasks;
create policy tasks_update_own on public.tasks for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists tasks_delete_own on public.tasks;
create policy tasks_delete_own on public.tasks for delete using (user_id = auth.uid());

drop policy if exists habits_select_own on public.habits;
create policy habits_select_own on public.habits for select using (user_id = auth.uid());
drop policy if exists habits_insert_own on public.habits;
create policy habits_insert_own on public.habits for insert with check (user_id = auth.uid());
drop policy if exists habits_update_own on public.habits;
create policy habits_update_own on public.habits for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists habits_delete_own on public.habits;
create policy habits_delete_own on public.habits for delete using (user_id = auth.uid());

drop policy if exists daily_logs_select_own on public.daily_logs;
create policy daily_logs_select_own on public.daily_logs for select using (user_id = auth.uid());
drop policy if exists daily_logs_insert_own on public.daily_logs;
create policy daily_logs_insert_own on public.daily_logs for insert with check (user_id = auth.uid());
drop policy if exists daily_logs_update_own on public.daily_logs;
create policy daily_logs_update_own on public.daily_logs for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists daily_logs_delete_own on public.daily_logs;
create policy daily_logs_delete_own on public.daily_logs for delete using (user_id = auth.uid());

drop policy if exists relapse_logs_select_own on public.relapse_logs;
create policy relapse_logs_select_own on public.relapse_logs for select using (user_id = auth.uid());
drop policy if exists relapse_logs_insert_own on public.relapse_logs;
create policy relapse_logs_insert_own on public.relapse_logs for insert with check (user_id = auth.uid());
drop policy if exists relapse_logs_update_own on public.relapse_logs;
create policy relapse_logs_update_own on public.relapse_logs for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists relapse_logs_delete_own on public.relapse_logs;
create policy relapse_logs_delete_own on public.relapse_logs for delete using (user_id = auth.uid());

drop policy if exists screen_logs_select_own on public.screen_logs;
create policy screen_logs_select_own on public.screen_logs for select using (user_id = auth.uid());
drop policy if exists screen_logs_insert_own on public.screen_logs;
create policy screen_logs_insert_own on public.screen_logs for insert with check (user_id = auth.uid());
drop policy if exists screen_logs_update_own on public.screen_logs;
create policy screen_logs_update_own on public.screen_logs for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists screen_logs_delete_own on public.screen_logs;
create policy screen_logs_delete_own on public.screen_logs for delete using (user_id = auth.uid());

drop policy if exists timers_select_own on public.timers;
create policy timers_select_own on public.timers for select using (user_id = auth.uid());
drop policy if exists timers_insert_own on public.timers;
create policy timers_insert_own on public.timers for insert with check (user_id = auth.uid());
drop policy if exists timers_update_own on public.timers;
create policy timers_update_own on public.timers for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists timers_delete_own on public.timers;
create policy timers_delete_own on public.timers for delete using (user_id = auth.uid());

drop policy if exists xp_events_select_own on public.xp_events;
create policy xp_events_select_own on public.xp_events for select using (user_id = auth.uid());
drop policy if exists xp_events_insert_own on public.xp_events;
create policy xp_events_insert_own on public.xp_events for insert with check (user_id = auth.uid());
drop policy if exists xp_events_update_own on public.xp_events;
create policy xp_events_update_own on public.xp_events for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists xp_events_delete_own on public.xp_events;
create policy xp_events_delete_own on public.xp_events for delete using (user_id = auth.uid());

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications for select using (user_id = auth.uid());
drop policy if exists notifications_insert_own on public.notifications;
create policy notifications_insert_own on public.notifications for insert with check (user_id = auth.uid());
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own on public.notifications for delete using (user_id = auth.uid());

drop policy if exists achievements_select_own on public.achievements;
create policy achievements_select_own on public.achievements for select using (user_id = auth.uid());
drop policy if exists achievements_insert_own on public.achievements;
create policy achievements_insert_own on public.achievements for insert with check (user_id = auth.uid());
drop policy if exists achievements_update_own on public.achievements;
create policy achievements_update_own on public.achievements for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists achievements_delete_own on public.achievements;
create policy achievements_delete_own on public.achievements for delete using (user_id = auth.uid());

drop policy if exists settings_select_own on public.settings;
create policy settings_select_own on public.settings for select using (user_id = auth.uid());
drop policy if exists settings_insert_own on public.settings;
create policy settings_insert_own on public.settings for insert with check (user_id = auth.uid());
drop policy if exists settings_update_own on public.settings;
create policy settings_update_own on public.settings for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists settings_delete_own on public.settings;
create policy settings_delete_own on public.settings for delete using (user_id = auth.uid());

drop policy if exists themes_select_own on public.themes;
create policy themes_select_own on public.themes for select using (user_id = auth.uid());
drop policy if exists themes_insert_own on public.themes;
create policy themes_insert_own on public.themes for insert with check (user_id = auth.uid());
drop policy if exists themes_update_own on public.themes;
create policy themes_update_own on public.themes for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists themes_delete_own on public.themes;
create policy themes_delete_own on public.themes for delete using (user_id = auth.uid());

drop policy if exists unlocks_select_own on public.unlocks;
create policy unlocks_select_own on public.unlocks for select using (user_id = auth.uid());
drop policy if exists unlocks_insert_own on public.unlocks;
create policy unlocks_insert_own on public.unlocks for insert with check (user_id = auth.uid());
drop policy if exists unlocks_update_own on public.unlocks;
create policy unlocks_update_own on public.unlocks for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists unlocks_delete_own on public.unlocks;
create policy unlocks_delete_own on public.unlocks for delete using (user_id = auth.uid());

drop policy if exists discipline_snapshots_select_own on public.discipline_snapshots;
create policy discipline_snapshots_select_own on public.discipline_snapshots for select using (user_id = auth.uid());
drop policy if exists discipline_snapshots_insert_own on public.discipline_snapshots;
create policy discipline_snapshots_insert_own on public.discipline_snapshots for insert with check (user_id = auth.uid());
drop policy if exists discipline_snapshots_update_own on public.discipline_snapshots;
create policy discipline_snapshots_update_own on public.discipline_snapshots for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists discipline_snapshots_delete_own on public.discipline_snapshots;
create policy discipline_snapshots_delete_own on public.discipline_snapshots for delete using (user_id = auth.uid());

drop policy if exists analytics_cache_select_own on public.analytics_cache;
create policy analytics_cache_select_own on public.analytics_cache for select using (user_id = auth.uid());
drop policy if exists analytics_cache_insert_own on public.analytics_cache;
create policy analytics_cache_insert_own on public.analytics_cache for insert with check (user_id = auth.uid());
drop policy if exists analytics_cache_update_own on public.analytics_cache;
create policy analytics_cache_update_own on public.analytics_cache for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists analytics_cache_delete_own on public.analytics_cache;
create policy analytics_cache_delete_own on public.analytics_cache for delete using (user_id = auth.uid());
