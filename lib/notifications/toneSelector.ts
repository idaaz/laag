import type { NotificationTone } from "@/lib/constants";

export interface ToneContext {
  disciplineScore: number;
  relapseRisk: number;
  repeatedMisses: number;
  unresolvedCriticalTasks: number;
  hourOfDay: number;
}

export function selectNotificationTone(context: ToneContext): NotificationTone {
  if (
    context.disciplineScore < 40 ||
    context.relapseRisk >= 70 ||
    (context.unresolvedCriticalTasks > 0 && context.hourOfDay >= 20)
  ) {
    return "mother";
  }

  if (
    context.disciplineScore < 70 ||
    context.relapseRisk >= 35 ||
    context.repeatedMisses >= 2
  ) {
    return "brutal";
  }

  return "motivational";
}
