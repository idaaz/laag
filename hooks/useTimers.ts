"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const TIMERS_KEY = ["timers"];

export function useTimers(userId?: string) {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  const timers = useQuery({
    queryKey: [...TIMERS_KEY, userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) throw new Error("Missing user");
      const { data, error } = await supabase
        .from("timers")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    }
  });

  const createTimerSession = useMutation({
    mutationFn: async (payload: {
      sessionType: "pomodoro" | "short_break" | "long_break" | "deep_work";
      startedAt: string;
      endedAt: string;
      durationMinutes: number;
      completed: boolean;
      xpAwarded: number;
      interruptions: number;
    }) => {
      if (!userId) throw new Error("Missing user");
      const { error } = await supabase.from("timers").insert({
        user_id: userId,
        session_type: payload.sessionType,
        started_at: payload.startedAt,
        ended_at: payload.endedAt,
        duration_minutes: payload.durationMinutes,
        completed: payload.completed,
        xp_awarded: payload.xpAwarded,
        interruptions: payload.interruptions
      } as never);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TIMERS_KEY })
  });

  return { timers, createTimerSession };
}
