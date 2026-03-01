"use client";

import Link from "next/link";
import type { FileAttachment } from "@/lib/supabase/storage";
import { useEffect, useMemo, useState } from "react";
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
import { calculateLevel } from "@/lib/engines/levelUtils";
import { useTimer } from "@/lib/context/TimerContext";
import { persistReminder } from "@/lib/notifications/scheduler";
import { useRealtime } from "@/hooks/useRealtime";
import { useRegisterKPIs } from "@/lib/context/MobileKPIContext";
import { useNotes } from "@/hooks/useNotes";

import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";

/* ─── Helpers ──────────────────────────────────────────────── */

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

import { TasksGraph, HabitStatCard, LogStatCard, NoteStatCard, TrackStatCard } from "@/components/dashboard/DashboardStats";

/* ─── Main Dashboard ──────────────────────────────────────── */

export default function DashboardPage() {
    const { user } = useAuth();
    const userId = user?.id;
    const [announcement, setAnnouncement] = useState<string | null>(null);
    const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
    const [flagsExpanded, setFlagsExpanded] = useState(false);
    const { summary } = useXP(userId);
    const timer = useTimer();

    useRealtime(
        ["tasks", "habits", "daily_logs", "time_blocks", "xp_events", "vision_notes", "visited_urls"],
        [["dashboard-metrics", userId ?? ""]]
    );

    // Active notes hook
    const { notes: recentNotes } = useNotes(userId, { limit: 5 });

    const dashboardQuery = useDashboardMetrics(userId);

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
                    <div className="flex items-center gap-6 rounded-2xl border border-white/8 bg-card/40 p-4 backdrop-blur-xl overflow-x-auto hide-scrollbar">
                        <div className="shrink-0">
                            <LevelRing level={level} xp={totalXP} nextLevelXP={nextLevelXP} />
                        </div>

                        <div className="flex-1 flex items-stretch gap-3 min-w-[700px]">
                            <TasksGraph
                                pending={dashboardQuery.data?.pendingTaskCount ?? 0}
                                completed={dashboardQuery.data?.completedTasks ?? 0}
                                overdue={dashboardQuery.data?.overdueTasks ?? 0}
                            />

                            <HabitStatCard
                                habits={dashboardQuery.data?.habitRows ?? []}
                                h={dashboardQuery.data?.habitRows?.find(h => h.id === selectedHabitId) || dashboardQuery.data?.habitRows?.[0] || null}
                                onSelect={setSelectedHabitId}
                            />

                            <LogStatCard
                                logged={dashboardQuery.data?.loggedDays ?? 0}
                                missed={dashboardQuery.data?.missedDays ?? 0}
                                accountability={dashboardQuery.data?.avgAccountability ?? 0}
                                energy={dashboardQuery.data?.avgEnergy ?? 0}
                            />

                            <NoteStatCard
                                completed={dashboardQuery.data?.notesCompleted ?? 0}
                                pending={dashboardQuery.data?.notesPending ?? 0}
                                pinned={dashboardQuery.data?.notesPinned ?? 0}
                            />

                            <TrackStatCard
                                total={dashboardQuery.data?.totalVisitsToday ?? 0}
                                top={dashboardQuery.data?.topVisit ?? { name: "N/A", count: 0 }}
                            />
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
                {(recentNotes?.length ?? 0) > 0 && (
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
                            {recentNotes.map((note) => (
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
