import { addHours, differenceInHours, parseISO } from "date-fns";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { selectNotificationTone } from "@/lib/notifications/toneSelector";
import type { NotificationType } from "@/lib/constants";

export interface ReminderInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  scheduledFor: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  context: {
    disciplineScore: number;
    relapseRisk: number;
    repeatedMisses: number;
    unresolvedCriticalTasks: number;
  };
}

export async function persistReminder(input: ReminderInput) {
  const supabase = getSupabaseBrowserClient();
  const tone = selectNotificationTone({
    ...input.context,
    hourOfDay: new Date().getHours()
  });

  return supabase.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    tone,
    title: input.title,
    body: input.body,
    scheduled_for: input.scheduledFor,
    related_entity_type: input.relatedEntityType ?? null,
    related_entity_id: input.relatedEntityId ?? null,
    escalation_level: 0
  } as never);
}

export function shouldEscalateTone(
  scheduledFor: string,
  readAt: string | null,
  escalationLevel: number
) {
  if (readAt) return false;
  const elapsed = differenceInHours(new Date(), parseISO(scheduledFor));
  return elapsed >= 2 && escalationLevel < 3;
}

export function nextEscalationTime(scheduledFor: string) {
  return addHours(parseISO(scheduledFor), 2).toISOString();
}
