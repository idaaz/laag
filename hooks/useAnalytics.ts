"use client";

import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildAnalyticsSeries } from "@/lib/engines/analyticsEngine";

export type AnalyticsRange = "7d" | "30d" | "90d";

function rangeToDays(range: AnalyticsRange) {
  return range === "7d" ? 7 : range === "30d" ? 30 : 90;
}

export function useAnalytics(userId?: string, range: AnalyticsRange = "30d") {
  const supabase = getSupabaseBrowserClient();
  const days = rangeToDays(range);

  return useQuery({
    queryKey: ["analytics", userId, range],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) throw new Error("Missing user");
      const start = subDays(new Date(), days).toISOString().slice(0, 10);

      const [xpDaily, logs, snapshots, cached] = await Promise.all([
        supabase
          .from("xp_events")
          .select("created_at,delta_xp")
          .eq("user_id", userId)
          .gte("created_at", `${start}T00:00:00.000Z`)
          .order("created_at", { ascending: true }),
        supabase
          .from("daily_logs")
          .select("log_date,study_minutes,workout_minutes,sleep_hours,screen_minutes,mood,productivity")
          .eq("user_id", userId)
          .gte("log_date", start)
          .order("log_date", { ascending: true }),
        supabase
          .from("discipline_snapshots")
          .select("snapshot_date,score")
          .eq("user_id", userId)
          .gte("snapshot_date", start)
          .order("snapshot_date", { ascending: true }),
        supabase
          .from("analytics_cache")
          .select("payload")
          .eq("user_id", userId)
          .eq("metric_key", `overview_${range}`)
          .gt("expires_at", new Date().toISOString())
          .maybeSingle()
      ]);

      const cachedData = cached.data as { payload?: unknown } | null;
      if (cachedData?.payload && typeof cachedData.payload === "object") {
        return cachedData.payload as ReturnType<typeof buildAnalyticsSeries>;
      }

      if (xpDaily.error) throw xpDaily.error;
      if (logs.error) throw logs.error;
      if (snapshots.error) throw snapshots.error;
      const xpDailyRows = (xpDaily.data ?? []) as Array<{ created_at: string; delta_xp: number }>;
      const logRows = (logs.data ?? []) as Array<{
        log_date: string;
        study_minutes: number;
        workout_minutes: number;
        sleep_hours: number;
        screen_minutes: number;
        mood: number;
        productivity: number;
      }>;
      const snapshotRows = (snapshots.data ?? []) as Array<{ snapshot_date: string; score: number }>;

      const map = new Map<string, number>();
      xpDailyRows.forEach((row) => {
        const day = row.created_at.slice(0, 10);
        map.set(day, (map.get(day) ?? 0) + row.delta_xp);
      });

      const model = buildAnalyticsSeries(
        {
          xpDaily: Array.from(map.entries()).map(([date, xp_total]) => ({ date, xp_total })),
          discipline: snapshotRows.map((item) => ({
            date: item.snapshot_date,
            score: Number(item.score)
          })),
          logs: logRows.map((item) => ({
            date: item.log_date,
            study_minutes: item.study_minutes,
            workout_minutes: item.workout_minutes,
            sleep_hours: Number(item.sleep_hours),
            screen_minutes: item.screen_minutes,
            mood: item.mood,
            productivity: item.productivity
          }))
        },
        Intl.DateTimeFormat().resolvedOptions().timeZone
      );

      await supabase.from("analytics_cache").upsert(
        {
          user_id: userId,
          metric_key: `overview_${range}`,
          period_start: start,
          period_end: new Date().toISOString().slice(0, 10),
          payload: model,
          generated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
          cache_version: 1
        } as never,
        { onConflict: "user_id,metric_key,period_start,period_end" }
      );

      return model;
    }
  });
}
