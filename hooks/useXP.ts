"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { defaultXPRules } from "@/lib/config/xpRules";
import { calculateXP, type XPEventInput } from "@/lib/engines/xpEngine";

const XP_QUERY_KEY = ["xp-summary"];

export function useXP(userId?: string) {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  const summary = useQuery({
    queryKey: [...XP_QUERY_KEY, userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) throw new Error("Missing user id");

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase.rpc("get_user_xp_summary", {
        target_user_id: userId,
        today_start: todayStart.toISOString()
      } as never);

      if (error) throw error;

      const rows = Array.isArray(data)
        ? (data as Array<{ total_xp: number | string; today_xp: number | string }>)
        : [];
      const result = rows[0] ?? { total_xp: 0, today_xp: 0 };

      return {
        totalXP: Number(result.total_xp),
        todayXP: Number(result.today_xp),
        events: [] // We no longer fetch events to save bandwidth
      };
    }
  });

  const awardXP = useMutation({
    mutationFn: async (input: XPEventInput & { sourceId?: string; reason?: string }) => {
      if (!userId) throw new Error("Missing user id");
      const current = summary.data ?? { totalXP: 0, todayXP: 0 };
      const result = calculateXP(input, defaultXPRules, {
        totalXPBefore: current.totalXP,
        dayXPBefore: current.todayXP
      });
      const { error } = await supabase.from("xp_events").insert({
        user_id: userId,
        source_type: input.sourceType,
        source_id: input.sourceId ?? null,
        delta_xp: result.finalXP,
        reason: input.reason ?? null,
        capped: result.capped,
        decay_applied: result.decayApplied
      } as never);
      if (error) throw error;
      return result;
    },
    onSuccess: async (data) => {
      // Invalidate both summary and events
      void queryClient.invalidateQueries({ queryKey: ["xp_summary"] });
      void queryClient.invalidateQueries({ queryKey: ["xp_events"] });

      // Trigger achievement check for habit creation
      if (userId) {
        fetch("/api/achievements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId })
        }).catch(console.error);
      }
    }
  });

  return { summary, awardXP };
}
