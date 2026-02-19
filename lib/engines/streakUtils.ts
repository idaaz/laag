import { addDays, differenceInCalendarDays, endOfDay, parseISO } from "date-fns";

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  streakAtRisk: boolean;
  nextBreakDeadline: string | null;
}

function formatYmd(date: Date, timeZone: string): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = fmt.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function computeTaskStreak(
  dates: string[],
  timezone: string,
  referenceDate = new Date()
): StreakResult {
  if (!dates.length) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      streakAtRisk: false,
      nextBreakDeadline: null
    };
  }

  const normalized = Array.from(
    new Set(
      dates.map((date) =>
        date.length > 10 ? formatYmd(new Date(date), timezone) : date.slice(0, 10)
      )
    )
  ).sort();

  let longestStreak = 1;
  let run = 1;

  for (let i = 1; i < normalized.length; i += 1) {
    const prev = parseISO(normalized[i - 1]);
    const current = parseISO(normalized[i]);
    const delta = differenceInCalendarDays(current, prev);
    if (delta === 1) {
      run += 1;
      longestStreak = Math.max(longestStreak, run);
    } else if (delta > 1) {
      run = 1;
    }
  }

  const todayYmd = formatYmd(referenceDate, timezone);
  const todayDate = parseISO(todayYmd);
  let currentStreak = 0;

  for (let i = normalized.length - 1; i >= 0; i -= 1) {
    const day = parseISO(normalized[i]);
    const expectedDay = addDays(todayDate, -currentStreak);
    if (differenceInCalendarDays(expectedDay, day) === 0) {
      currentStreak += 1;
    } else if (
      currentStreak === 0 &&
      differenceInCalendarDays(todayDate, day) === 1
    ) {
      // Yesterday still counts as at-risk streak.
      currentStreak = 1;
    } else {
      break;
    }
  }

  const lastActiveDate = normalized[normalized.length - 1] ?? null;
  const streakAtRisk =
    !!lastActiveDate && differenceInCalendarDays(todayDate, parseISO(lastActiveDate)) >= 1;
  const nextBreakDeadline = lastActiveDate
    ? endOfDay(addDays(parseISO(lastActiveDate), 1)).toISOString()
    : null;

  return {
    currentStreak,
    longestStreak,
    lastActiveDate,
    streakAtRisk,
    nextBreakDeadline
  };
}
