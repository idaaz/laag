export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "LAAG";
export const DEFAULT_TIMEZONE =
  process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE ?? "America/Los_Angeles";

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/tasks",
  "/habits",
  "/daily-logs",
  "/analytics",
  "/achievements",
  "/settings"
] as const;

export const TABLE_EXPORT_ORDER = [
  "users",
  "tasks",
  "habits",
  "daily_logs",
  "relapse_logs",
  "screen_logs",
  "timers",
  "xp_events",
  "notifications",
  "achievements",
  "settings",
  "themes",
  "unlocks",
  "discipline_snapshots",
  "analytics_cache"
] as const;

export type NotificationTone = "motivational" | "brutal" | "mother";
export type NotificationType =
  | "task_deadline"
  | "habit_reminder"
  | "streak_warning"
  | "daily_log_reminder"
  | "relapse_alert";
