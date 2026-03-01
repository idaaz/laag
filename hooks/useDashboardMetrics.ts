"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { computeTaskStreak } from "@/lib/engines/streakUtils";
import { detectRelapseRisk } from "@/lib/engines/relapseEngine";
import type { DailyLogRow, HabitRow, TaskRow, TimeBlockRow } from "@/lib/supabase/types";

function toLocalDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function isActionableTask(task: TaskRow) {
    return task.status === "todo" || task.status === "in_progress";
}

export function useDashboardMetrics(userId?: string) {
    const supabase = getSupabaseBrowserClient();

    return useQuery({
        queryKey: ["dashboard-metrics", userId],
        enabled: !!userId,
        staleTime: 1000 * 60 * 5,   // 5 minutes — no refetch on page focus
        gcTime: 1000 * 60 * 10,     // 10 minutes in cache
        queryFn: async () => {
            if (!userId) throw new Error("Missing user");

            const now = new Date();
            const startOfToday = new Date(now);
            startOfToday.setHours(0, 0, 0, 0);
            const endOfToday = new Date(now);
            endOfToday.setHours(23, 59, 59, 999);
            const weekAgoStart = new Date(startOfToday);
            weekAgoStart.setDate(weekAgoStart.getDate() - 6);

            const today = toLocalDateKey(startOfToday);
            const weekAgo = toLocalDateKey(weekAgoStart);

            const [tasks, habits, dailyLogs, spikeFlags, timeBlocks, xpEvents, notes, tracks] = await Promise.all([
                supabase.from("tasks").select("*").eq("user_id", userId),
                supabase.from("habits").select("*").eq("user_id", userId),
                supabase
                    .from("daily_logs")
                    .select("*")
                    .eq("user_id", userId)
                    .gte("log_date", weekAgo)
                    .order("log_date", { ascending: false }),
                supabase
                    .from("notifications")
                    .select("id,title,body,created_at")
                    .eq("user_id", userId)
                    .eq("type", "relapse_alert")
                    .order("created_at", { ascending: false })
                    .limit(10),
                supabase
                    .from("time_blocks")
                    .select("id,category,start_time,energy_level")
                    .eq("user_id", userId)
                    .gte("start_time", startOfToday.toISOString())
                    .lte("start_time", endOfToday.toISOString()),
                supabase
                    .from("xp_events")
                    .select("created_at,delta_xp")
                    .eq("user_id", userId)
                    .gte("created_at", weekAgoStart.toISOString())
                    .order("created_at", { ascending: true }),
                supabase.from("vision_notes").select("id,pinned,archived").eq("user_id", userId),
                supabase.from("visited_urls").select("url,title,visited_at").eq("user_id", userId).gte("visited_at", startOfToday.toISOString())
            ]);

            if (tasks.error) throw tasks.error;
            if (habits.error) throw habits.error;
            if (dailyLogs.error) throw dailyLogs.error;
            if (spikeFlags.error) throw spikeFlags.error;
            if (timeBlocks.error) throw timeBlocks.error;
            if (xpEvents.error) throw xpEvents.error;
            if (notes.error) throw notes.error;
            if (tracks.error) throw tracks.error;

            // Fetch GitHub archived daily logs
            let githubLogs: DailyLogRow[] = [];
            try {
                const res = await fetch(`/api/archive?type=daily_logs`);
                if (res.ok) {
                    const json = await res.json();
                    if (json.data) {
                        githubLogs = (json.data as DailyLogRow[][]).flat().filter((row) => row.log_date >= weekAgo);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch archived daily logs", e);
            }

            const taskRows = (tasks.data ?? []) as TaskRow[];
            const habitRows = (habits.data ?? []) as HabitRow[];

            // Deduplicate and merge logs favoring Supabase for more recent data
            const supabaseLogRows = (dailyLogs.data ?? []) as DailyLogRow[];
            const mergedLogsMap = new Map<string, DailyLogRow>();
            githubLogs.forEach(l => mergedLogsMap.set(l.log_date, l));
            supabaseLogRows.forEach(l => mergedLogsMap.set(l.log_date, l));
            const dailyLogRows = Array.from(mergedLogsMap.values()).sort((a, b) => b.log_date.localeCompare(a.log_date));

            const spikeFlagRows = (spikeFlags.data ?? []) as Array<{
                id: string; title: string; body: string; created_at: string;
            }>;
            const timeBlockRows = (timeBlocks.data ?? []) as Array<Pick<TimeBlockRow, "id" | "category" | "start_time" | "energy_level">>;
            const xpRows = (xpEvents.data ?? []) as Array<{ created_at: string; delta_xp: number }>;
            const noteRows = (notes.data ?? []) as Array<{ id: string; pinned: boolean; archived: boolean }>;
            const trackRows = (tracks.data ?? []) as Array<{ url: string; title: string | null; visited_at: string }>;

            // Core metrics
            const completedTasks = taskRows.filter((t) => t.status === "completed").length;
            const totalTasks = taskRows.length;
            const actionableTasks = taskRows.filter(isActionableTask);
            const overdueTasks = actionableTasks.filter((t) => t.deadline_at && new Date(t.deadline_at).getTime() < now.getTime()).length;
            const tasksDueToday = actionableTasks.filter((t) => t.deadline_at && toLocalDateKey(new Date(t.deadline_at)) === today).length;
            const pendingTaskCount = actionableTasks.length;

            const activeHabits = habitRows.filter((h) => h.is_active);
            const habitsWithRecent = activeHabits.filter(
                (h) => !!h.last_completed_on && h.last_completed_on >= weekAgo
            );
            const habitConsistency = activeHabits.length > 0 ? habitsWithRecent.length / activeHabits.length : 0;
            const habitsPending = activeHabits.filter((h) => h.last_completed_on !== today).length;

            const todayLog = dailyLogRows.find((l) => l.log_date === today) ?? null;
            const dailyLogCompletion = todayLog ? Number(todayLog.daily_log_completion) : 0;

            // Streak
            const streakDates = taskRows
                .filter((t) => t.completed_at)
                .map((t) => t.completed_at as string);
            const streak = computeTaskStreak(
                streakDates,
                Intl.DateTimeFormat().resolvedOptions().timeZone
            );

            // Relapse risk
            const relapse = detectRelapseRisk({
                missedHabitsLast3Days: Math.max(0, 3 - habitsWithRecent.length),
                avgSleepHours7d:
                    dailyLogRows.reduce((s, r) => s + Number(r.sleep_hours), 0) /
                    Math.max(dailyLogRows.length, 1),
                avgScreenMinutes7d:
                    dailyLogRows.reduce((s, r) => s + r.screen_minutes, 0) /
                    Math.max(dailyLogRows.length, 1),
                disciplineScore: 0,
                currentStreak: streak.currentStreak
            });

            // Deep work
            const deepWorkHours = Number(
                (timeBlockRows.filter((b) => b.category === "Deep Work").length * 0.5).toFixed(1)
            );

            // XP trend
            const xpByDay = new Map<string, number>();
            xpRows.forEach((r) => {
                const key = toLocalDateKey(new Date(r.created_at));
                xpByDay.set(key, (xpByDay.get(key) ?? 0) + r.delta_xp);
            });
            const weekdayFmt = new Intl.DateTimeFormat(undefined, { weekday: "short" });
            const xpTrend = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(weekAgoStart);
                d.setDate(weekAgoStart.getDate() + i);
                return { date: weekdayFmt.format(d), xp: xpByDay.get(toLocalDateKey(d)) ?? 0 };
            });

            // Flags
            const flagCount = spikeFlagRows.length + taskRows.filter((t) => t.is_flagged || t.override_reason).length;
            const flagDetails = [
                ...spikeFlagRows.slice(0, 5).map((f) => ({ id: f.id, msg: f.title, time: f.created_at })),
            ];

            // Notes stats
            const notesCompleted = noteRows.filter(n => n.archived).length;
            const notesPending = noteRows.filter(n => !n.archived).length;
            const notesPinned = noteRows.filter(n => n.pinned).length;

            // Track stats
            const totalVisitsToday = trackRows.length;
            const visitCounts = new Map<string, number>();
            trackRows.forEach(r => visitCounts.set(r.title || r.url, (visitCounts.get(r.title || r.url) ?? 0) + 1));
            let topVisit = { name: "N/A", count: 0 };
            visitCounts.forEach((count, name) => {
                if (count > topVisit.count) topVisit = { name, count };
            });

            // Log stats (Accountability & Energy)
            const avgAccountability = dailyLogRows.length > 0
                ? Math.round(dailyLogRows.reduce((acc, log) => acc + (log.productivity || 0), 0) / dailyLogRows.length)
                : 0;
            const avgEnergy = timeBlockRows.length > 0
                ? Number((timeBlockRows.reduce((acc, tb) => acc + (tb.energy_level || 0), 0) / timeBlockRows.length).toFixed(1))
                : 0;
            const loggedDays = dailyLogRows.filter(l => l.log_date >= weekAgo).length;
            const missedDays = 7 - loggedDays;

            return {
                completedTasks,
                totalTasks,
                pendingTaskCount,
                tasksDueToday,
                overdueTasks,
                habitConsistency,
                habitsPending,
                dailyLogCompletion,
                todayLog,
                streak,
                relapse,
                deepWorkHours,
                xpTrend,
                xpLast7Days: xpTrend.reduce((s, i) => s + i.xp, 0),
                flagCount,
                flagDetails,
                noteRows,
                trackRows,
                notesCompleted,
                notesPending,
                notesPinned,
                totalVisitsToday,
                topVisit,
                avgAccountability,
                avgEnergy,
                loggedDays,
                missedDays,
                habitRows: habitRows as HabitRow[]
            };
        }
    });
}
