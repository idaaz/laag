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
    staleTime: 1000 * 60 * 5,   // 5 minutes — analytics data doesn't need constant refetch
    queryFn: async () => {
      if (!userId) throw new Error("Missing user");
      const start = subDays(new Date(), days).toISOString().slice(0, 10);

      const [xpDaily, logs, snapshots, cached, timeBlocks, activeHabits, completions, tasksReq] = await Promise.all([
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
          .eq("metric_key", `v2_overview_${range}`)
          .gt("expires_at", new Date().toISOString())
          .maybeSingle(),
        supabase
          .from("time_blocks")
          .select("start_time,end_time")
          .eq("user_id", userId)
          .gte("start_time", `${start}T00:00:00.000Z`)
          .order("start_time", { ascending: true }),
        supabase
          .from("habits")
          .select("id,name,relapse_count")
          .eq("user_id", userId),
        supabase
          .from("habit_completion_answers")
          .select("habit_id,completion_date")
          .eq("user_id", userId)
          .gte("completion_date", start),
        supabase
          .from("tasks")
          .select("id,completed_at,created_at")
          .eq("user_id", userId)
          .gte("created_at", `${start}T00:00:00.000Z`)
      ]);

      const cachedData = cached.data as { payload?: unknown } | null;
      if (cachedData?.payload && typeof cachedData.payload === "object") {
        return cachedData.payload as ReturnType<typeof buildAnalyticsSeries>;
      }

      if (xpDaily.error) throw xpDaily.error;
      if (logs.error) throw logs.error;
      if (snapshots.error) throw snapshots.error;
      if (timeBlocks.error) throw timeBlocks.error;
      if (activeHabits.error) throw activeHabits.error;
      if (completions.error) throw completions.error;
      if (tasksReq.error) throw tasksReq.error;

      // Fetch GitHub archived daily logs
      let githubLogs: any[] = [];
      try {
        const res = await fetch(`/api/archive?type=daily_logs`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            githubLogs = json.data.flat().filter((row: any) => row.log_date >= start);
          }
        }
      } catch (e) {
        console.error("Failed to fetch archived daily logs", e);
      }
      const xpDailyRows = (xpDaily.data ?? []) as Array<{ created_at: string; delta_xp: number }>;
      const supabaseLogRows = (logs.data ?? []) as Array<{
        log_date: string;
        study_minutes: number;
        workout_minutes: number;
        sleep_hours: number;
        screen_minutes: number;
        mood: number;
        productivity: number;
      }>;
      const snapshotRows = (snapshots.data ?? []) as Array<{ snapshot_date: string; score: number }>;

      // Deduplicate and merge logs favoring Supabase for more recent data
      const mergedLogsMap = new Map<string, any>();
      githubLogs.forEach(l => mergedLogsMap.set(l.log_date, l));
      supabaseLogRows.forEach(l => mergedLogsMap.set(l.log_date, l));
      const logRows = Array.from(mergedLogsMap.values()).sort((a, b) => a.log_date.localeCompare(b.log_date));

      const map = new Map<string, number>();
      xpDailyRows.forEach((row) => {
        const day = row.created_at.slice(0, 10);
        map.set(day, (map.get(day) ?? 0) + row.delta_xp);
      });

      const timeBlockRows = (timeBlocks.data ?? []) as Array<{ start_time: string; end_time: string }>;
      const habitRows = (activeHabits.data ?? []) as Array<{ id: string; name: string; relapse_count: number }>;
      const compRows = (completions.data ?? []) as Array<{ habit_id: string; completion_date: string; }>;
      const taskRows = (tasksReq.data ?? []) as Array<{ id: string; completed_at: string | null; created_at: string }>;

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
          })),
          timeBlocks: timeBlockRows,
          habits: habitRows,
          completions: compRows,
          tasks: taskRows
        },
        Intl.DateTimeFormat().resolvedOptions().timeZone
      );

      // Cache is best-effort; silently ignore 401 / RLS errors
      try {
        await supabase.from("analytics_cache").upsert(
          {
            user_id: userId,
            metric_key: `v2_overview_${range}`,
            period_start: start,
            period_end: new Date().toISOString().slice(0, 10),
            payload: model,
            generated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
            cache_version: 1
          } as never,
          { onConflict: "user_id,metric_key,period_start,period_end" }
        );
      } catch (_) {
        // cache failure is non-fatal
      }

      return model;
    }
  });
}
