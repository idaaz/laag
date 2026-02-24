/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

// Shared KPI endpoint the extension calls with a userId param
// GET /api/kpi?userId=<uuid>
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        const supabase = getAdminClient();

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const today = new Date().toISOString().slice(0, 10);

        const fetchAnalytics = async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rpcParams: any = {
                p_user_id: userId,
                p_start_date: thirtyDaysAgo.toISOString()
            };
            return (supabase as any).rpc("get_tracking_analytics", rpcParams);
        };

        const [analyticsResult, tasksResult, habitsResult, xpResult, logsResult] = await Promise.all([
            fetchAnalytics(),
            supabase.from("tasks").select("*").eq("user_id", userId),
            supabase.from("habits").select("*").eq("user_id", userId).eq("is_active", true),
            supabase.from("xp_events").select("delta_xp").eq("user_id", userId),
            supabase.from("daily_logs").select("*").eq("user_id", userId).order("log_date", { ascending: false }).limit(7)
        ]);

        // Error checking for each result (critical for debugging prod 404/500s)
        if (analyticsResult.error) console.error("KPI API: Analytics Error:", analyticsResult.error);
        if (tasksResult.error) console.error("KPI API: Tasks Error:", tasksResult.error);
        if (habitsResult.error) console.error("KPI API: Habits Error:", habitsResult.error);
        if (xpResult.error) console.error("KPI API: XP Error:", xpResult.error);
        if (logsResult.error) console.error("KPI API: Logs Error:", logsResult.error);

        const analytics = (analyticsResult.data ?? {}) as Record<string, unknown>;
        const tasks = (tasksResult.data ?? []) as Database["public"]["Tables"]["tasks"]["Row"][];
        const habits = (habitsResult.data ?? []) as Database["public"]["Tables"]["habits"]["Row"][];
        const xpEvents = (xpResult.data ?? []) as Database["public"]["Tables"]["xp_events"]["Row"][];
        const logs = (logsResult.data ?? []) as Database["public"]["Tables"]["daily_logs"]["Row"][];

        const totalXP = xpEvents.reduce((sum, e) => sum + (e.delta_xp ?? 0), 0);
        const pendingTasks = tasks.filter(t => t.status !== "completed" && t.status !== "archived");
        const overdueTasks = pendingTasks.filter(t => t.deadline_at && new Date(t.deadline_at).getTime() < Date.now());
        const habitsLoggedToday = habits.filter(h => h.last_completed_on === today).length;

        // Calculate a simple discipline score (avg of task completion rate and habit consistency)
        const taskCompletionRate = tasks.length > 0 ? (tasks.filter(t => t.status === "completed").length / tasks.length) * 100 : 0;
        const habitConsistency = habits.length > 0 ? (habitsLoggedToday / habits.length) * 100 : 0;
        const disciplineScore = Math.round((taskCompletionRate + habitConsistency) / 2);

        const topDomains = (analytics.topDomains as unknown[] || []);
        const analyticsCategories = (analytics.categories as unknown[] || []);

        const response = {
            summary: {
                totalXP,
                disciplineScore,
                focusScore: (analytics.focusScore as number) || 0,
                level: Math.floor(totalXP / 1000) + 1
            },
            tasks: {
                pending: pendingTasks.length,
                overdue: overdueTasks.length,
                total: tasks.length,
                critical: pendingTasks.filter(t => t.priority === "critical").length
            },
            habits: {
                loggedToday: habitsLoggedToday,
                totalActive: habits.length,
                streaks: habits.map(h => ({ name: h.name, streak: h.current_streak })).sort((a, b) => b.streak - a.streak).slice(0, 3)
            },
            tracking: {
                totalVisits: (analytics.totalVisits as number) || 0,
                uniqueDomains: (analytics.uniqueDomains as number) || 0,
                topDomains: topDomains.slice(0, 5),
                categories: analyticsCategories.slice(0, 5)
            },
            logs: {
                hasLoggedToday: logs.some(l => l.log_date === today),
                recentMood: logs.length > 0 ? Math.round(logs.reduce((sum, l) => sum + l.mood, 0) / logs.length) : 0,
                recentProductivity: logs.length > 0 ? Math.round(logs.reduce((sum, l) => sum + l.productivity, 0) / logs.length) : 0
            }
        };

        return NextResponse.json({ kpi: response });
    } catch (error) {
        console.error("KPI API Route Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
