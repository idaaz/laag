"use client";

import Link from "next/link";
import type { FileAttachment } from "@/lib/supabase/storage";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    AlertTriangle,
    ArrowRight,
    BookOpen,
    ChevronDown,
    ChevronUp,
    Clock3,
    Flame,
    ListTodo,
    Moon,
    NotebookPen,
    Pause,
    Play,
    Shield,
    Smartphone,
    Square,
    Target,
    Zap
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { LiveRegion } from "@/components/structure/LiveRegion";
import { PageFrame } from "@/components/structure/PageFrame";
import { SectionHeader } from "@/components/structure/SectionHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useXP } from "@/hooks/useXP";
import { evaluateDiscipline } from "@/lib/engines/disciplineEngine";
import { detectRelapseRisk } from "@/lib/engines/relapseEngine";
import { computeTaskStreak } from "@/lib/engines/streakUtils";
import { calculateLevel } from "@/lib/engines/levelUtils";
import { useTimer } from "@/lib/context/TimerContext";
import { persistReminder } from "@/lib/notifications/scheduler";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";
import type { DailyLogRow, HabitRow, TaskRow, TimeBlockRow } from "@/lib/supabase/types";
import { useRegisterKPIs } from "@/lib/context/MobileKPIContext";
import { useNotes } from "@/hooks/useNotes";

/* ─── Helpers ──────────────────────────────────────────────── */

function toLocalDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function isActionableTask(task: TaskRow) {
    return task.status === "todo" || task.status === "in_progress";
}

function formatTimerClock(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/* ─── SVG Level Ring ──────────────────────────────────────── */

function LevelRing({ level, xp, nextLevelXP }: { level: number; xp: number; nextLevelXP: number }) {
    const progress = nextLevelXP > 0 ? Math.min((xp % 100) / 100, 1) : 0;
    const radius = 52;
    const stroke = 6;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - progress);

    return (
        <div className="relative flex items-center justify-center" style={{ width: 128, height: 128 }}>
            <svg width="128" height="128" viewBox="0 0 128 128" className="transform -rotate-90">
                {/* Background ring */}
                <circle
                    cx="64" cy="64" r={radius}
                    fill="none"
                    stroke="hsl(var(--border))"
                    strokeWidth={stroke}
                    opacity={0.3}
                />
                {/* Progress ring */}
                <circle
                    cx="64" cy="64" r={radius}
                    fill="none"
                    stroke="var(--k-teal)"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-700 ease-out"
                    style={{ filter: "drop-shadow(0 0 6px var(--k-teal))" }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Level</span>
                <span className="text-3xl font-black tabular-nums text-foreground leading-none">{level}</span>
                <span className="text-[10px] font-medium tabular-nums text-muted-foreground mt-0.5">
                    {xp} XP
                </span>
            </div>
        </div>
    );
}

/* ─── Mini Circular Gauge ─────────────────────────────────── */

function MiniGauge({ value, max, label, color, suffix = "%" }: {
    value: number; max: number; label: string; color: string; suffix?: string;
}) {
    const progress = max > 0 ? Math.min(value / max, 1) : 0;
    const r = 28;
    const circumference = 2 * Math.PI * r;
    const off = circumference * (1 - progress);

    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className="relative" style={{ width: 68, height: 68 }}>
                <svg width="68" height="68" viewBox="0 0 68 68" className="-rotate-90">
                    <circle cx="34" cy="34" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={4} opacity={0.25} />
                    <circle
                        cx="34" cy="34" r={r} fill="none"
                        stroke={color} strokeWidth={4} strokeLinecap="round"
                        strokeDasharray={circumference} strokeDashoffset={off}
                        className="transition-all duration-500 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold tabular-nums" style={{ color }}>
                        {Math.round(value)}{suffix}
                    </span>
                </div>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
    );
}

/* ─── Pulse Bar ───────────────────────────────────────────── */

function PulseBar({ icon: Icon, label, value, unit, max, color }: {
    icon: typeof Clock3; label: string; value: number; unit: string; max: number; color: string;
}) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <Icon className="h-4 w-4 shrink-0" style={{ color }} />
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color }}>
                        {typeof value === "number" ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}{unit}
                    </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                </div>
            </div>
        </div>
    );
}

/* ─── Action Row ──────────────────────────────────────────── */

function ActionRow({ icon: Icon, label, count, href, color }: {
    icon: typeof ListTodo; label: string; count: number; href: string; color: string;
}) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between rounded-xl border border-white/8 bg-card/40 px-4 py-3 backdrop-blur-sm transition-all duration-200 hover:bg-card/60 hover:border-white/15 active:scale-[0.98]"
        >
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg" style={{ backgroundColor: `${color}15` }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                </div>
                <div>
                    <span className="text-sm font-semibold text-foreground">{count}</span>
                    <span className="text-sm text-muted-foreground ml-1.5">{label}</span>
                </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
        </Link>
    );
}

/* ─── Main Dashboard ──────────────────────────────────────── */

export default function DashboardPage() {
    const supabase = getSupabaseBrowserClient();
    const { user } = useAuth();
    const userId = user?.id;
    const [announcement, setAnnouncement] = useState<string | null>(null);
    const [flagsExpanded, setFlagsExpanded] = useState(false);
    const { summary } = useXP(userId);
    const timer = useTimer();

    useRealtime(
        ["tasks", "habits", "daily_logs", "time_blocks", "xp_events"],
        [["dashboard-metrics", userId ?? ""]]
    );

    // Active notes hook
    const { notes } = useNotes(userId, { limit: 5 });

    const dashboardQuery = useQuery({
        queryKey: ["dashboard-metrics", userId],
        enabled: !!userId,
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

            const [tasks, habits, dailyLogs, spikeFlags, timeBlocks, xpEvents] = await Promise.all([
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
                    .select("id,category,start_time")
                    .eq("user_id", userId)
                    .gte("start_time", startOfToday.toISOString())
                    .lte("start_time", endOfToday.toISOString()),
                supabase
                    .from("xp_events")
                    .select("created_at,delta_xp")
                    .eq("user_id", userId)
                    .gte("created_at", weekAgoStart.toISOString())
                    .order("created_at", { ascending: true })
            ]);

            if (tasks.error) throw tasks.error;
            if (habits.error) throw habits.error;
            if (dailyLogs.error) throw dailyLogs.error;
            if (spikeFlags.error) throw spikeFlags.error;
            if (timeBlocks.error) throw timeBlocks.error;
            if (xpEvents.error) throw xpEvents.error;

            const taskRows = (tasks.data ?? []) as TaskRow[];
            const habitRows = (habits.data ?? []) as HabitRow[];
            const dailyLogRows = (dailyLogs.data ?? []) as DailyLogRow[];
            const spikeFlagRows = (spikeFlags.data ?? []) as Array<{
                id: string; title: string; body: string; created_at: string;
            }>;
            const timeBlockRows = (timeBlocks.data ?? []) as Array<Pick<TimeBlockRow, "id" | "category" | "start_time">>;
            const xpRows = (xpEvents.data ?? []) as Array<{ created_at: string; delta_xp: number }>;

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
            };
        }
    });

    const totalXP = summary.data?.totalXP ?? 0;
    const level = calculateLevel(totalXP, 100);
    const nextLevelXP = (level + 1) * 100;

    const discipline = useMemo(() => {
        const m = dashboardQuery.data;
        if (!m) {
            return evaluateDiscipline({ completedTasks: 0, totalTasks: 0, habitConsistency: 0, dailyLogCompletion: 0, level: 0 });
        }
        return evaluateDiscipline({
            completedTasks: m.completedTasks,
            totalTasks: m.totalTasks,
            habitConsistency: m.habitConsistency,
            dailyLogCompletion: m.dailyLogCompletion,
            level
        });
    }, [dashboardQuery.data, level]);

    // Streak reminder
    useEffect(() => {
        if (!userId) return;
        const streak = dashboardQuery.data?.streak;
        if (!streak?.streakAtRisk || !streak.nextBreakDeadline) return;
        const localFlag = `laag-streak-reminder-${streak.nextBreakDeadline}`;
        if (localStorage.getItem(localFlag)) return;
        const warningIso = new Date(
            Math.max(Date.now(), new Date(streak.nextBreakDeadline).getTime() - 6 * 60 * 60 * 1000)
        ).toISOString();
        persistReminder({
            userId,
            type: "streak_warning",
            title: "Streak at risk",
            body: "Complete one action before your streak window closes.",
            scheduledFor: warningIso,
            relatedEntityType: "streak",
            context: {
                disciplineScore: discipline.score,
                relapseRisk: dashboardQuery.data?.relapse.riskScore ?? 0,
                repeatedMisses: 1,
                unresolvedCriticalTasks: 0
            }
        }).finally(() => localStorage.setItem(localFlag, "1"));
    }, [
        userId, dashboardQuery.data?.streak, dashboardQuery.data?.streak?.nextBreakDeadline,
        dashboardQuery.data?.streak?.streakAtRisk, dashboardQuery.data?.relapse?.riskScore, discipline.score
    ]);

    // Derived values
    const taskCompletion = dashboardQuery.data
        ? dashboardQuery.data.totalTasks > 0
            ? Math.round((dashboardQuery.data.completedTasks / dashboardQuery.data.totalTasks) * 100)
            : 0
        : 0;

    const timerClock = formatTimerClock(timer.secondsLeft);
    const timerLabel =
        timer.sessionType === "pomodoro" ? "Pomodoro"
            : timer.sessionType === "deep_work" ? "Deep Work"
                : timer.sessionType === "short_break" ? "Short Break"
                    : "Long Break";

    const riskTier = dashboardQuery.data?.relapse.tier ?? "low";
    const riskColor = riskTier === "high" ? "var(--k-red)" : riskTier === "medium" ? "var(--k-orange)" : "var(--k-green)";

    // KPIs for mobile overlay
    const kpis = useMemo(() => [
        { label: "XP", value: totalXP, color: "info" as const },
        { label: "Score", value: `${discipline.score}%`, color: discipline.score < 45 ? "danger" as const : "score" as const },
        { label: "Streak", value: dashboardQuery.data?.streak.currentStreak ?? 0, color: "achievement" as const },
        { label: "Done", value: `${taskCompletion}%`, color: "success" as const },
        { label: "Deep Work", value: `${(dashboardQuery.data?.deepWorkHours ?? 0).toFixed(1)}h`, color: "focus" as const },
        { label: "Overdue", value: dashboardQuery.data?.overdueTasks ?? 0, color: (dashboardQuery.data?.overdueTasks ?? 0) > 0 ? "danger" as const : "default" as const }
    ], [totalXP, discipline.score, dashboardQuery.data, taskCompletion]);

    useRegisterKPIs(kpis);

    return (
        <>
            <PageFrame
                header={
                    <SectionHeader
                        title="Dashboard"
                        description="Command center."
                        icon={<Target className="h-5 w-5" />}
                    />
                }
            >
                {/* ═══════════════════════════════════════════════
                    SECTION 1: HERO — Level Ring + Vital Stats
                ═══════════════════════════════════════════════ */}
                <div className="col-span-full">
                    <div className="flex items-center gap-5 rounded-2xl border border-white/8 bg-card/40 p-5 backdrop-blur-xl">
                        <LevelRing level={level} xp={totalXP} nextLevelXP={nextLevelXP} />
                        <div className="flex-1 space-y-3">
                            {/* Streak */}
                            <div className="flex items-center gap-2">
                                <Flame className="h-4 w-4 text-[var(--k-gold)]" />
                                <span className="text-sm font-semibold text-foreground">
                                    {dashboardQuery.data?.streak.currentStreak ?? 0}
                                </span>
                                <span className="text-xs text-muted-foreground">day streak</span>
                            </div>
                            {/* Discipline Score */}
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" style={{ color: discipline.score < 45 ? "var(--k-red)" : discipline.score < 70 ? "var(--k-orange)" : "var(--k-green)" }} />
                                <span className="text-sm font-semibold text-foreground">{discipline.score}%</span>
                                <span className="text-xs text-muted-foreground">discipline</span>
                            </div>
                            {/* Risk */}
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" style={{ color: riskColor }} />
                                <span className="text-sm font-semibold capitalize" style={{ color: riskColor }}>
                                    {riskTier}
                                </span>
                                <span className="text-xs text-muted-foreground">risk</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════
                    SECTION 2: SLIM TIMER BAR
                ═══════════════════════════════════════════════ */}
                <div className="col-span-full">
                    <div className="flex items-center justify-between rounded-xl border border-white/8 bg-card/40 px-4 py-2.5 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <Clock3 className="h-4 w-4 text-[var(--k-teal)]" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{timerLabel}</span>
                            <span className="text-lg font-bold tabular-nums text-foreground">{timerClock}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {!timer.running ? (
                                <Button
                                    size="sm"
                                    className="h-7 px-3 text-xs rounded-full"
                                    onClick={() => {
                                        timer.start();
                                        setAnnouncement(`${timerLabel} started.`);
                                    }}
                                >
                                    <Play className="h-3 w-3 mr-1" />
                                    Start
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-3 text-xs rounded-full"
                                    onClick={() => {
                                        timer.pause();
                                        timer.addInterruption();
                                        setAnnouncement(`${timerLabel} paused.`);
                                    }}
                                >
                                    <Pause className="h-3 w-3 mr-1" />
                                    Pause
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 rounded-full p-0"
                                onClick={() => {
                                    timer.stop();
                                    setAnnouncement("Timer stopped.");
                                }}
                            >
                                <Square className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════
                    SECTION 3: TODAY'S PULSE
                ═══════════════════════════════════════════════ */}
                <div className="col-span-full">
                    <div className="rounded-2xl border border-white/8 bg-card/40 p-4 backdrop-blur-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Today&apos;s Pulse</h3>
                            <Link href="/daily-logs" className="text-[10px] font-semibold uppercase tracking-wider text-primary hover:underline">
                                View Logs
                            </Link>
                        </div>
                        <PulseBar icon={BookOpen} label="Study" value={dashboardQuery.data?.todayLog?.study_minutes ?? 0} unit="m" max={120} color="var(--k-green)" />
                        <PulseBar icon={Moon} label="Sleep" value={Number(dashboardQuery.data?.todayLog?.sleep_hours ?? 0)} unit="h" max={9} color="var(--k-blue)" />
                        <PulseBar icon={Smartphone} label="Screen" value={dashboardQuery.data?.todayLog?.screen_minutes ?? 0} unit="m" max={300} color="var(--k-orange)" />
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════
                    SECTION 4: ACTION FEED
                ═══════════════════════════════════════════════ */}
                <div className="col-span-full space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Action Feed</h3>
                    <ActionRow
                        icon={ListTodo}
                        label={dashboardQuery.data?.overdueTasks ? "tasks due (incl. overdue)" : "tasks pending"}
                        count={dashboardQuery.data?.pendingTaskCount ?? 0}
                        href="/tasks"
                        color="var(--k-blue)"
                    />
                    <ActionRow
                        icon={Zap}
                        label="habits pending today"
                        count={dashboardQuery.data?.habitsPending ?? 0}
                        href="/habits"
                        color="var(--k-gold)"
                    />
                </div>

                {/* ═══════════════════════════════════════════════
                    SECTION 4.5: QUICK CONTEXT / RECENT NOTES
                ═══════════════════════════════════════════════ */}
                {(notes?.length ?? 0) > 0 && (
                    <div className="col-span-full space-y-2 mt-2">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                <NotebookPen className="h-3 w-3" /> Recent Notes
                            </h3>
                            <Link href="/notes" className="text-[10px] font-semibold uppercase tracking-wider text-primary hover:underline">
                                View Hub
                            </Link>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                            {notes.map((note) => (
                                <Link
                                    href={`/notes`}
                                    key={note.id}
                                    className="relative flex-shrink-0 w-64 rounded-xl border border-white/8 bg-card/40 p-4 backdrop-blur-sm transition-all duration-200 hover:bg-card/60 hover:border-white/20 hover:-translate-y-0.5 group"
                                >
                                    {note.pinned && (
                                        <div className="absolute top-3 right-3">
                                            <Flame className="h-3 w-3 text-primary" />
                                        </div>
                                    )}
                                    <h4 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors pr-8">
                                        {note.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {note.body || "No details provided."}
                                    </p>
                                    {((note.attachments as FileAttachment[])?.length ?? 0) > 0 && (
                                        <div className="mt-2 flex items-center gap-1.5 overflow-hidden">
                                            <div className="h-1.5 w-4 rounded-full bg-primary/40" />
                                            <span className="text-[10px] text-muted-foreground/60 font-semibold">
                                                {(note.attachments as FileAttachment[]).length} Attachment{((note.attachments as FileAttachment[])?.length ?? 0) !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    )}
                                </Link>
                            ))}
                            {/* "Add Note" Card */}
                            <Link
                                href="/notes?action=new"
                                className="flex-shrink-0 w-24 rounded-xl border border-dashed border-white/10 bg-card/20 flex flex-col items-center justify-center p-4 transition-all duration-200 hover:bg-card/60 hover:border-primary/50 text-muted-foreground hover:text-primary gap-2"
                            >
                                <NotebookPen className="h-5 w-5" />
                                <span className="text-[10px] font-bold uppercase">New</span>
                            </Link>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════
                    SECTION 5: ANALYTICS GRID (2×2)
                ═══════════════════════════════════════════════ */}
                <div className="col-span-full">
                    <div className="rounded-2xl border border-white/8 bg-card/40 p-4 backdrop-blur-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Analytics</h3>
                            <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                                {dashboardQuery.data?.xpLast7Days ?? 0} XP this week
                            </span>
                        </div>

                        {/* Mini Gauges Row */}
                        <div className="grid grid-cols-4 gap-2">
                            <MiniGauge value={taskCompletion} max={100} label="Tasks" color="var(--k-green)" />
                            <MiniGauge value={Math.round((dashboardQuery.data?.habitConsistency ?? 0) * 100)} max={100} label="Habits" color="var(--k-gold)" />
                            <MiniGauge value={dashboardQuery.data?.deepWorkHours ?? 0} max={4} label="Deep Work" color="var(--k-teal)" suffix="h" />
                            <MiniGauge
                                value={Math.round((dashboardQuery.data?.dailyLogCompletion ?? 0) * 100)}
                                max={100} label="Log" color="var(--k-indigo)"
                            />
                        </div>

                        {/* XP Sparkline */}
                        <div className="h-20 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dashboardQuery.data?.xpTrend ?? []} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                                    <defs>
                                        <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--k-teal)" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="var(--k-teal)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area
                                        type="monotone"
                                        dataKey="xp"
                                        stroke="var(--k-teal)"
                                        strokeWidth={2}
                                        fill="url(#xpGrad)"
                                        dot={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-between px-1">
                            {(dashboardQuery.data?.xpTrend ?? []).map((d) => (
                                <span key={d.date} className="text-[9px] text-muted-foreground/60">{d.date}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════
                    SECTION 6: FLAGS BANNER (Collapsed)
                ═══════════════════════════════════════════════ */}
                {(dashboardQuery.data?.flagCount ?? 0) > 0 && (
                    <div className="col-span-full">
                        <button
                            onClick={() => setFlagsExpanded(!flagsExpanded)}
                            className="w-full flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 transition-colors hover:bg-destructive/10"
                        >
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                <span className="text-sm font-semibold text-destructive">
                                    {dashboardQuery.data?.flagCount} flag{(dashboardQuery.data?.flagCount ?? 0) !== 1 ? "s" : ""} need attention
                                </span>
                            </div>
                            {flagsExpanded ? (
                                <ChevronUp className="h-4 w-4 text-destructive/60" />
                            ) : (
                                <ChevronDown className="h-4 w-4 text-destructive/60" />
                            )}
                        </button>
                        {flagsExpanded && (dashboardQuery.data?.flagDetails.length ?? 0) > 0 && (
                            <div className="mt-2 space-y-1.5">
                                {dashboardQuery.data?.flagDetails.map((f) => (
                                    <div key={f.id} className="rounded-lg border border-destructive/15 bg-destructive/5 px-3 py-2">
                                        <p className="text-xs text-foreground">{f.msg}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </PageFrame>
            <LiveRegion message={announcement} />
        </>
    );
}
