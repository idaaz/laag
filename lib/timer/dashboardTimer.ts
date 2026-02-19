export type DashboardSessionType = "pomodoro" | "short_break" | "long_break" | "deep_work";

export type DashboardTimerSnapshot = {
  sessionType: DashboardSessionType;
  secondsLeft: number;
  running: boolean;
  startedAt: string | null;
  endsAt: string | null;
  baseDurationSeconds: number;
  interruptions: number;
};

export const DASHBOARD_TIMER_STORAGE_KEY = "laag-active-timer";
export const DASHBOARD_TIMER_EVENT = "laag:dashboard-timer-updated";

export const SESSION_DURATIONS_SECONDS: Record<DashboardSessionType, number> = {
  pomodoro: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
  deep_work: 50 * 60
};

export function readDashboardTimerSnapshot(): DashboardTimerSnapshot | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DASHBOARD_TIMER_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DashboardTimerSnapshot;
    if (!parsed.sessionType) return null;
    return parsed;
  } catch {
    window.localStorage.removeItem(DASHBOARD_TIMER_STORAGE_KEY);
    return null;
  }
}

export function writeDashboardTimerSnapshot(
  snapshot: DashboardTimerSnapshot | null,
  emit = false
) {
  if (typeof window === "undefined") return;
  if (!snapshot) {
    window.localStorage.removeItem(DASHBOARD_TIMER_STORAGE_KEY);
  } else {
    window.localStorage.setItem(DASHBOARD_TIMER_STORAGE_KEY, JSON.stringify(snapshot));
  }
  if (emit) {
    window.dispatchEvent(new Event(DASHBOARD_TIMER_EVENT));
  }
}

export function getRemainingSeconds(snapshot: DashboardTimerSnapshot): number {
  if (!snapshot.running || !snapshot.endsAt) {
    return Math.max(0, snapshot.secondsLeft);
  }
  const remaining = Math.ceil((new Date(snapshot.endsAt).getTime() - Date.now()) / 1000);
  return Math.max(0, remaining);
}
