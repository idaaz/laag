"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  CheckSquare,
  Clock3,
  Flame,
  ListTodo,
  NotebookPen,
  Pause,
  Play,
  Plus,
  Square,
  Zap
} from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppCard } from "@/components/structure/AppCard";
import { LiveRegion } from "@/components/structure/LiveRegion";
import { PageFrame } from "@/components/structure/PageFrame";
import { QuickActionBar } from "@/components/structure/QuickActionBar";
import { SectionHeader } from "@/components/structure/SectionHeader";
import { PomodoroTimer } from "@/components/timer/PomodoroTimer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { pushToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { useXP } from "@/hooks/useXP";
import { evaluateDiscipline } from "@/lib/engines/disciplineEngine";
import { detectRelapseRisk } from "@/lib/engines/relapseEngine";
import { computeTaskStreak } from "@/lib/engines/streakUtils";
import { useTimer } from "@/lib/context/TimerContext";
import { persistReminder } from "@/lib/notifications/scheduler";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";
import type { DailyLogRow, HabitRow, TaskRow, TimeBlockRow, VisionNoteRow } from "@/lib/supabase/types";
import { useRegisterKPIs } from "@/lib/context/MobileKPIContext";
import { FloatingActionButton } from "@/components/structure/FloatingActionButton";
import { Plus } from "lucide-react";

type TopTask = {
  id: string;
  title: string;
  priority: TaskRow["priority"];
  overdue: boolean;
  dueToday: boolean;
  deadlineAt: string | null;
};

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isActionableTask(task: TaskRow) {
  return task.status === "todo" || task.status === "in_progress";
}

function formatDateTime(value: string | null) {
  if (!value) return "No deadline";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatShortDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatShortDate(value: string | null) {
  if (!value) return "No date";
  return new Date(`${value}T00:00:00`).toLocaleDateString([], {
    month: "short",
    day: "numeric"
  });
}

function formatTimerClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function useAnimatedValue(value: number, duration = 300) {
  const [display, setDisplay] = useState(value);
  const previousRef = useRef(value);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      setDisplay(value);
      previousRef.current = value;
      return;
    }

    const from = previousRef.current;
    const diff = value - from;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setDisplay(from + diff * progress);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        previousRef.current = value;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, value]);

  return display;
}

function MetricCard({
  label,
  value,
  suffix,
  icon,
  decimals = 0,
  tone = "default"
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: ComponentType<{ className?: string }>;
  decimals?: number;
  tone?: "default" | "success" | "danger" | "warning" | "info" | "focus" | "score" | "achievement" | "calibration";
}) {
  const display = useAnimatedValue(value);
  const Icon = icon;
  const toneClass =
    tone === "success" ? "text-[var(--k-green)]" :
      tone === "danger" ? "text-[var(--k-red)]" :
        tone === "warning" ? "text-[var(--k-orange)]" :
          tone === "info" ? "text-[var(--k-blue)]" :
            tone === "focus" ? "text-[var(--k-teal)]" :
              tone === "score" ? "text-[var(--k-indigo)]" :
                tone === "achievement" ? "text-[var(--k-gold)]" :
                  tone === "calibration" ? "text-[var(--k-purple)]" :
                    "text-foreground";
  const shownValue =
    decimals > 0 ? Number(display.toFixed(decimals)).toFixed(decimals) : String(Math.round(display));

  return (
    <AppCard className="h-full" padded={false}>
      <div className="p-3 space-y-2" role="status" aria-label={`${shownValue}${suffix ?? ""} ${label}`}>
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground md:text-xs">{label}</p>
          <Icon className={toneClass} />
        </div>
        <p className={`text-2xl font-semibold tabular-nums leading-none md:text-3xl ${toneClass}`}>
          {shownValue}
          {suffix ?? ""}
        </p>
      </div>
    </AppCard>
  );
}

function MiniXPTrend({ data }: { data: Array<{ date: string; xp: number }> }) {
  return (
    <div className="h-40 w-full md:h-44" aria-label="7-day XP trend chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 2 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.12} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} interval={0} />
          <YAxis hide />
          <Tooltip formatter={(value) => [`${value} XP`, "XP"]} />
          <Line
            type="monotone"
            dataKey="xp"
            stroke="var(--k-blue)"
            strokeWidth={2.5}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const { user } = useAuth();
  const userId = user?.id;
  const [timerMessage, setTimerMessage] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const { summary, awardXP } = useXP(userId);
  const timer = useTimer();

  // Subscribe to changes for dashboard metrics
  useRealtime(
    ["tasks", "habits", "daily_logs", "time_blocks", "xp_events", "vision_notes"],
    [["dashboard-metrics", userId ?? ""]]
  );

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

      const [tasks, habits, dailyLogs, flags, spikeFlags, timeBlocks, xpEvents, visionNotes] = await Promise.all([
        supabase.from("tasks").select("*").eq("user_id", userId),
        supabase.from("habits").select("*").eq("user_id", userId),
        supabase
          .from("daily_logs")
          .select("*")
          .eq("user_id", userId)
          .gte("log_date", weekAgo)
          .order("log_date", { ascending: false }),
        supabase
          .from("tasks")
          .select("id,title,override_reason,created_at")
          .eq("user_id", userId)
          .or("is_flagged.eq.true,override_reason.not.is.null")
          .order("created_at", { ascending: false })
          .limit(10),
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
          .order("created_at", { ascending: true }),
        supabase
          .from("vision_notes")
          .select("id,title,body,note_type,vision_pillar,review_date,pinned,updated_at,archived")
          .eq("user_id", userId)
          .order("pinned", { ascending: false })
          .order("updated_at", { ascending: false })
          .limit(12)
      ]);

      if (tasks.error) throw tasks.error;
      if (habits.error) throw habits.error;
      if (dailyLogs.error) throw dailyLogs.error;
      if (flags.error) throw flags.error;
      if (spikeFlags.error) throw spikeFlags.error;
      if (timeBlocks.error) throw timeBlocks.error;
      if (xpEvents.error) throw xpEvents.error;
      if (visionNotes.error) throw visionNotes.error;

      const taskRows = (tasks.data ?? []) as TaskRow[];
      const habitRows = (habits.data ?? []) as HabitRow[];
      const dailyLogRows = (dailyLogs.data ?? []) as DailyLogRow[];
      const flaggedTaskRows = (flags.data ?? []) as Array<{
        id: string;
        title: string;
        override_reason: string | null;
        created_at: string;
      }>;
      const spikeFlagRows = (spikeFlags.data ?? []) as Array<{
        id: string;
        title: string;
        body: string;
        created_at: string;
      }>;
      const timeBlockRows = (timeBlocks.data ?? []) as Array<Pick<TimeBlockRow, "id" | "category" | "start_time">>;
      const xpRows = (xpEvents.data ?? []) as Array<{ created_at: string; delta_xp: number }>;
      const noteRows = (visionNotes.data ?? []) as Array<
        Pick<
          VisionNoteRow,
          "id" | "title" | "body" | "review_date" | "pinned" | "updated_at" | "archived" | "vision_pillar"
        >
      >;

      const completedTasks = taskRows.filter((task) => task.status === "completed").length;
      const totalTasks = taskRows.length;
      const activeHabits = habitRows.filter((habit) => habit.is_active);
      const habitsWithRecent = activeHabits.filter(
        (habit) => !!habit.last_completed_on && habit.last_completed_on >= weekAgo
      );
      const habitConsistency =
        activeHabits.length > 0 ? habitsWithRecent.length / activeHabits.length : 0;
      const todayLog = dailyLogRows.find((item) => item.log_date === today) ?? null;
      const dailyLogCompletion = todayLog ? Number(todayLog.daily_log_completion) : 0;

      const streakDates = taskRows
        .filter((task) => task.completed_at)
        .map((task) => task.completed_at as string);
      const streak = computeTaskStreak(
        streakDates,
        Intl.DateTimeFormat().resolvedOptions().timeZone
      );

      const relapse = detectRelapseRisk({
        missedHabitsLast3Days: Math.max(0, 3 - habitsWithRecent.length),
        avgSleepHours7d:
          dailyLogRows.reduce((sum, row) => sum + Number(row.sleep_hours), 0) /
          Math.max(dailyLogRows.length, 1),
        avgScreenMinutes7d:
          dailyLogRows.reduce((sum, row) => sum + row.screen_minutes, 0) /
          Math.max(dailyLogRows.length, 1),
        disciplineScore: 0,
        currentStreak: streak.currentStreak
      });

      const overdueTasks = taskRows.filter((task) => {
        if (!isActionableTask(task) || !task.deadline_at) return false;
        return new Date(task.deadline_at).getTime() < now.getTime();
      }).length;

      const priorityWeight: Record<TaskRow["priority"], number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1
      };

      const topTasks: TopTask[] = taskRows
        .filter(isActionableTask)
        .map((task) => {
          const deadlineAt = task.deadline_at;
          const dueToday = deadlineAt ? toLocalDateKey(new Date(deadlineAt)) === today : false;
          const overdue = deadlineAt ? new Date(deadlineAt).getTime() < now.getTime() : false;
          const deadlineScore = deadlineAt ? new Date(deadlineAt).getTime() : Number.POSITIVE_INFINITY;
          const statusScore = overdue ? 0 : dueToday ? 1 : 2;
          return { task, dueToday, overdue, deadlineScore, statusScore };
        })
        .sort((a, b) => {
          if (a.statusScore !== b.statusScore) return a.statusScore - b.statusScore;
          const priorityDelta = priorityWeight[b.task.priority] - priorityWeight[a.task.priority];
          if (priorityDelta !== 0) return priorityDelta;
          return a.deadlineScore - b.deadlineScore;
        })
        .slice(0, 5)
        .map((item) => ({
          id: item.task.id,
          title: item.task.title,
          priority: item.task.priority,
          overdue: item.overdue,
          dueToday: item.dueToday,
          deadlineAt: item.task.deadline_at
        }));

      const habitsDueToday = activeHabits
        .filter((habit) => habit.last_completed_on !== today)
        .sort((a, b) => {
          if (a.current_streak !== b.current_streak) return a.current_streak - b.current_streak;
          return b.frequency_per_week - a.frequency_per_week;
        })
        .slice(0, 5);

      const deepWorkHours = Number(
        (timeBlockRows.filter((block) => block.category === "Deep Work").length * 0.5).toFixed(1)
      );

      const xpByDay = new Map<string, number>();
      xpRows.forEach((row) => {
        const key = toLocalDateKey(new Date(row.created_at));
        xpByDay.set(key, (xpByDay.get(key) ?? 0) + row.delta_xp);
      });

      const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: "short" });
      const xpTrend = Array.from({ length: 7 }, (_, idx) => {
        const day = new Date(weekAgoStart);
        day.setDate(weekAgoStart.getDate() + idx);
        const key = toLocalDateKey(day);
        return {
          date: weekdayFormatter.format(day),
          xp: xpByDay.get(key) ?? 0
        };
      });

      const latestFlags = [
        ...flaggedTaskRows.map((item) => ({
          id: item.id,
          source: "task",
          message: item.override_reason ?? item.title,
          createdAtIso: item.created_at
        })),
        ...spikeFlagRows.map((item) => ({
          id: item.id,
          source: "spike",
          message: `${item.title}: ${item.body}`,
          createdAtIso: item.created_at
        }))
      ]
        .sort((a, b) => new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime())
        .slice(0, 5)
        .map((item) => ({
          id: item.id,
          source: item.source,
          message: item.message,
          createdAt: formatShortDateTime(item.createdAtIso)
        }));

      const activeNotes = noteRows.filter((note) => !note.archived);
      const pinnedNotes = activeNotes
        .filter((note) => note.pinned)
        .slice(0, 3)
        .map((note) => ({
          id: note.id,
          title: note.title,
          pillar: note.vision_pillar,
          reviewDate: formatShortDate(note.review_date)
        }));
      const reviewDueNotes = activeNotes
        .filter((note) => !!note.review_date && note.review_date <= today)
        .slice(0, 3)
        .map((note) => ({
          id: note.id,
          title: note.title,
          reviewDate: formatShortDate(note.review_date)
        }));

      return {
        completedTasks,
        totalTasks,
        habitConsistency,
        dailyLogCompletion,
        streak,
        relapse,
        overdueTasks,
        deepWorkHours,
        topTasks,
        habitsDueToday,
        todayLog,
        xpTrend,
        xpLast7Days: xpTrend.reduce((sum, item) => sum + item.xp, 0),
        flags: latestFlags,
        visionNotes: {
          activeCount: activeNotes.length,
          pinned: pinnedNotes,
          reviewDue: reviewDueNotes
        }
      };
    }
  });

  const discipline = useMemo(() => {
    const metrics = dashboardQuery.data;
    if (!metrics) {
      return evaluateDiscipline({
        completedTasks: 0,
        totalTasks: 0,
        habitConsistency: 0,
        dailyLogCompletion: 0,
        level: 0
      });
    }

    return evaluateDiscipline({
      completedTasks: metrics.completedTasks,
      totalTasks: metrics.totalTasks,
      habitConsistency: metrics.habitConsistency,
      dailyLogCompletion: metrics.dailyLogCompletion,
      level: Math.floor((summary.data?.totalXP ?? 0) / 100)
    });
  }, [dashboardQuery.data, summary.data?.totalXP]);

  useEffect(() => {
    if (!userId) return;
    const streak = dashboardQuery.data?.streak;
    if (!streak?.streakAtRisk || !streak.nextBreakDeadline) return;
    const localFlag = `laag-streak-reminder-${streak.nextBreakDeadline}`;
    if (localStorage.getItem(localFlag)) return;
    const warningIso = new Date(
      Math.max(
        Date.now(),
        new Date(streak.nextBreakDeadline).getTime() - 6 * 60 * 60 * 1000
      )
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
    }).finally(() => {
      localStorage.setItem(localFlag, "1");
    });
  }, [
    userId,
    dashboardQuery.data?.streak,
    dashboardQuery.data?.streak.nextBreakDeadline,
    dashboardQuery.data?.streak.streakAtRisk,
    dashboardQuery.data?.relapse.riskScore,
    discipline.score
  ]);

  const taskCompletion = dashboardQuery.data
    ? dashboardQuery.data.totalTasks > 0
      ? Math.round((dashboardQuery.data.completedTasks / dashboardQuery.data.totalTasks) * 100)
      : 0
    : 0;
  const dailyLogPercent = Math.round((dashboardQuery.data?.dailyLogCompletion ?? 0) * 100);
  const timerClock = formatTimerClock(timer.secondsLeft);
  const timerSessionLabel =
    timer.sessionType === "pomodoro"
      ? "Pomodoro"
      : timer.sessionType === "deep_work"
        ? "Deep Work"
        : timer.sessionType === "short_break"
          ? "Short Break"
          : "Long Break";

  const kpis = useMemo(() => [
    { label: "XP", value: summary.data?.totalXP ?? 0, color: "info" as const },
    { label: "Score", value: `${discipline.score}%`, color: discipline.score < 45 ? "danger" as const : "score" as const },
    { label: "Streak", value: dashboardQuery.data?.streak.currentStreak ?? 0, color: "achievement" as const },
    { label: "Done", value: `${taskCompletion}%`, color: "success" as const },
    { label: "Deep Work", value: `${(dashboardQuery.data?.deepWorkHours ?? 0).toFixed(1)}h`, color: "focus" as const },
    { label: "Overdue", value: dashboardQuery.data?.overdueTasks ?? 0, color: (dashboardQuery.data?.overdueTasks ?? 0) > 0 ? "danger" as const : "default" as const }
  ], [summary.data, discipline.score, dashboardQuery.data, taskCompletion]);

  useRegisterKPIs(kpis);

  return (
    <>
      <PageFrame
        header={
          <SectionHeader
            title="Dashboard"
            description="Act now."
            icon={<Activity className="h-5 w-5" />}
            actions={
              <QuickActionBar
                className="hidden md:flex"
                actions={[
                  {
                    id: "new-task",
                    label: "New Task",
                    icon: <Plus className="h-4 w-4" />,
                    tooltip: "Open tasks and create one.",
                    onRun: () => router.push("/tasks?action=new")
                  },
                  {
                    id: "new-habit",
                    label: "New Habit",
                    icon: <Zap className="h-4 w-4" />,
                    tooltip: "Add a recurring discipline.",
                    onRun: () => router.push("/habits?action=new")
                  },
                  {
                    id: "new-log",
                    label: "New Log",
                    icon: <Activity className="h-4 w-4" />,
                    tooltip: "Record what you're doing now.",
                    onRun: () => router.push("/daily-logs?action=new")
                  },
                  {
                    id: "new-note",
                    label: "New Note",
                    icon: <NotebookPen className="h-4 w-4" />,
                    tooltip: "Capture a project thought.",
                    onRun: () => router.push("/notes?action=new")
                  }
                ]}
              />
            }
          />
        }
      >
        <div className="col-span-full md:hidden">
          <AppCard title="Quick Start" hint="One tap to create.">
            <div className="flex items-center justify-between gap-2">
              <Button size="icon" variant="outline" className="h-10 w-full" onClick={() => router.push("/tasks")} title="New Task">
                <Plus className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="outline" className="h-10 w-full" onClick={() => router.push("/habits")} title="New Habit">
                <Zap className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="outline" className="h-10 w-full" onClick={() => router.push("/daily-logs")} title="New Log">
                <Activity className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="outline" className="h-10 w-full" onClick={() => router.push("/notes?action=new")} title="New Note">
                <NotebookPen className="h-5 w-5" />
              </Button>
            </div>
          </AppCard>
        </div>

        <div className="col-span-full">
          <div className="hidden lg:grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
            <MetricCard label="XP" value={summary.data?.totalXP ?? 0} icon={BarChart3} tone="info" />
            <MetricCard
              label="Score"
              value={discipline.score}
              suffix="%"
              icon={Activity}
              tone={discipline.score < 45 ? "danger" : "score"}
            />
            <MetricCard
              label="Streak"
              value={dashboardQuery.data?.streak.currentStreak ?? 0}
              icon={Flame}
              tone="achievement"
            />
            <MetricCard label="Done" value={taskCompletion} suffix="%" icon={CheckSquare} tone="success" />
            <MetricCard
              label="Deep Work"
              value={dashboardQuery.data?.deepWorkHours ?? 0}
              suffix="h"
              icon={Clock3}
              tone="focus"
              decimals={1}
            />
            <MetricCard
              label="Overdue"
              value={dashboardQuery.data?.overdueTasks ?? 0}
              icon={ListTodo}
              tone={(dashboardQuery.data?.overdueTasks ?? 0) > 0 ? "danger" : "default"}
            />
          </div>
        </div>

        <div className="col-span-full md:hidden sticky top-2 z-20" id="timer-anchor">
          <AppCard title="Pomodoro" hint={`${timerSessionLabel} ready.`} className="bg-card/95 backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <p className="text-3xl font-semibold tabular-nums">{timerClock}</p>
              <div className="flex items-center gap-2">
                {!timer.running ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      timer.start();
                      setAnnouncement(`${timerSessionLabel} started.`);
                    }}
                  >
                    <Play className="h-3.5 w-3.5 mr-1" />
                    Start
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      timer.pause();
                      timer.addInterruption();
                      setAnnouncement(`${timerSessionLabel} paused.`);
                    }}
                  >
                    <Pause className="h-3.5 w-3.5 mr-1" />
                    Pause
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    timer.stop();
                    setAnnouncement("Timer stopped.");
                  }}
                >
                  <Square className="h-3.5 w-3.5 mr-1" />
                  Stop
                </Button>
              </div>
            </div>
          </AppCard>
        </div>

        <div className="col-span-full lg:col-span-8">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <AppCard
              title="Top Tasks"
              hint="Top priorities. Mobile shows 3."
              className="h-full"
              actions={
                <Button size="sm" variant="outline" onClick={() => router.push("/tasks")}>
                  Open Tasks
                </Button>
              }
            >
              {(dashboardQuery.data?.topTasks.length ?? 0) ? (
                <ul className="space-y-2">
                  {dashboardQuery.data?.topTasks.map((task, index) => (
                    <li key={task.id} className={index >= 3 ? "hidden md:list-item" : undefined}>
                      <Link
                        href={`/tasks/${task.id}`}
                        prefetch
                        scroll={false}
                        className="block rounded-lg border border-border/70 bg-background/60 p-2 transition-colors hover:border-primary/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-tight">{task.title}</p>
                          <span className="rounded-md border border-border/70 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                            {task.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {task.overdue ? "Overdue" : task.dueToday ? "Due today" : "Upcoming"}
                          {` | ${formatDateTime(task.deadlineAt)}`}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No pending tasks.</p>
              )}
            </AppCard>

            <AppCard
              title="Habits Due Today"
              hint="Due habits. Mobile shows 3."
              className="h-full"
              actions={
                <Button size="sm" variant="outline" onClick={() => router.push("/habits")}>
                  Open Habits
                </Button>
              }
            >
              {(dashboardQuery.data?.habitsDueToday.length ?? 0) ? (
                <ul className="space-y-2">
                  {dashboardQuery.data?.habitsDueToday.map((habit, index) => (
                    <li
                      key={habit.id}
                      className={index >= 3 ? "hidden md:list-item rounded-lg border border-border/70 bg-background/60 p-2" : "rounded-lg border border-border/70 bg-background/60 p-2"}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{habit.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {habit.frequency_per_week}/week
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Streak {habit.current_streak} | Best {habit.longest_streak}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">All active habits logged for today.</p>
              )}
            </AppCard>

            <AppCard
              title="Daily Log"
              hint="Today&apos;s completion."
              className="h-full"
              actions={
                <Button size="sm" variant="outline" onClick={() => router.push("/daily-logs")}>
                  Open Logs
                </Button>
              }
            >
              <div className="space-y-3">
                <div className="flex items-end justify-between gap-3">
                  <p className="text-sm text-muted-foreground">Completion</p>
                  <p className="text-2xl font-semibold tabular-nums">{dailyLogPercent}%</p>
                </div>
                <Progress value={dailyLogPercent} />
                {dashboardQuery.data?.todayLog ? (
                  <dl className="grid grid-cols-3 gap-2 text-sm">
                    <div className="rounded-lg border border-border/70 bg-background/60 p-2">
                      <dt className="text-xs text-muted-foreground">Study</dt>
                      <dd className="font-semibold tabular-nums">
                        {dashboardQuery.data.todayLog.study_minutes}m
                      </dd>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background/60 p-2">
                      <dt className="text-xs text-muted-foreground">Sleep</dt>
                      <dd className="font-semibold tabular-nums">
                        {Number(dashboardQuery.data.todayLog.sleep_hours).toFixed(1)}h
                      </dd>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background/60 p-2">
                      <dt className="text-xs text-muted-foreground">Screen</dt>
                      <dd className="font-semibold tabular-nums">
                        {dashboardQuery.data.todayLog.screen_minutes}m
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No log entry yet today. Add one block to keep momentum.
                  </p>
                )}
              </div>
            </AppCard>

            <AppCard
              title="Vision Notes"
              hint={`${dashboardQuery.data?.visionNotes.activeCount ?? 0} active notes.`}
              className="h-full"
              actions={
                <Button size="sm" variant="outline" onClick={() => router.push("/notes")}>
                  Open Notes
                </Button>
              }
            >
              <div className="space-y-3">
                {(dashboardQuery.data?.visionNotes.reviewDue.length ?? 0) ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-warning">Review Due</p>
                    <ul className="mt-2 space-y-2">
                      {dashboardQuery.data?.visionNotes.reviewDue.map((note) => (
                        <li key={note.id} className="rounded-lg border border-warning/30 bg-warning/10 p-2">
                          <p className="text-sm font-semibold">{note.title}</p>
                          <p className="text-xs text-muted-foreground">Review by {note.reviewDate}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {(dashboardQuery.data?.visionNotes.pinned.length ?? 0) ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">Pinned</p>
                    <ul className="mt-2 space-y-2">
                      {dashboardQuery.data?.visionNotes.pinned.map((note) => (
                        <li key={note.id} className="rounded-lg border border-primary/30 bg-primary/10 p-2">
                          <p className="text-sm font-semibold">{note.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {note.pillar} | {note.reviewDate}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {(dashboardQuery.data?.visionNotes.pinned.length ?? 0) === 0 &&
                  (dashboardQuery.data?.visionNotes.reviewDue.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No highlighted notes yet. Capture your first project idea.
                  </p>
                ) : null}
              </div>
            </AppCard>

            <AppCard
              title="Truth Mode Flags"
              hint="Latest flags. Mobile shows 3."
              className="h-full"
            >
              {(dashboardQuery.data?.flags.length ?? 0) ? (
                <ul className="space-y-2">
                  {dashboardQuery.data?.flags.map((event, index) => (
                    <li
                      key={event.id}
                      className={index >= 3 ? "hidden md:list-item rounded-lg border border-destructive/30 bg-destructive/5 p-2" : "rounded-lg border border-destructive/30 bg-destructive/5 p-2"}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
                          {event.source}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{event.createdAt}</p>
                      </div>
                      <p className="mt-1 text-sm">{event.message}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No flagged events.</p>
              )}
            </AppCard>
          </div>
        </div>

        <div className="col-span-full lg:col-span-4 space-y-3">
          <div className="hidden md:block">
            <PomodoroTimer
              onStateChange={(message) => setAnnouncement(message)}
              onCompleted={async ({ sessionType, startedAt, endedAt, durationMinutes }) => {
                if (!userId) return;
                await awardXP.mutateAsync({
                  sourceType: "timer_complete",
                  completed: true,
                  reason: `${sessionType} complete`
                });
                await supabase.from("timers").insert({
                  user_id: userId,
                  session_type: sessionType,
                  started_at: startedAt,
                  ended_at: endedAt,
                  duration_minutes: durationMinutes,
                  completed: true,
                  interruptions: 0,
                  xp_awarded: Math.round(durationMinutes / 2)
                } as never);
                setTimerMessage("Complete");
                setAnnouncement("Pomodoro completed.");
                pushToast("Complete", "XP awarded.");
              }}
            />
            {timerMessage ? (
              <p className="text-xs text-success" role="status" aria-live="polite">
                {timerMessage}
              </p>
            ) : null}
          </div>

          <AppCard
            title="7-Day XP Trend"
            hint={`${dashboardQuery.data?.xpLast7Days ?? 0} XP in the last 7 days.`}
          >
            <MiniXPTrend data={dashboardQuery.data?.xpTrend ?? []} />
          </AppCard>
        </div>
      </PageFrame>
      <LiveRegion message={announcement} />

      <FloatingActionButton
        label="New Task"
        onClick={() => router.push("/tasks?action=new")}
      />
    </>
  );
}
