"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useMemo } from "react";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PageFrame } from "@/components/structure/PageFrame";
import { SectionHeader } from "@/components/structure/SectionHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useAnalytics } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";
import { useRegisterKPIs } from "@/lib/context/MobileKPIContext";

import { CategoryROIScatter } from "@/components/charts/CategoryROIScatter";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { TasksGraph, HabitStatCard, LogStatCard, NoteStatCard, TrackStatCard } from "@/components/dashboard/DashboardStats";

const CommandScoreArea = dynamic(() =>
    import("@/components/charts/CommandScoreArea").then((m) => m.CommandScoreArea)
);
const ExecutionGapBar = dynamic(() =>
    import("@/components/charts/ExecutionGapBar").then((m) => m.ExecutionGapBar)
);

function TrendIndicator({ trend }: { trend: "improving" | "worsening" | "stable" }) {
    const Icon = trend === "improving" ? TrendingDown : trend === "worsening" ? TrendingUp : Minus;
    const color =
        trend === "improving"
            ? "text-[var(--k-green)]"
            : trend === "worsening"
                ? "text-[var(--k-red)]"
                : "text-muted-foreground";

    return (
        <div className={cn("flex items-center gap-1 text-xs font-medium", color)}>
            <Icon className="h-3.5 w-3.5" />
            <span className="capitalize">{trend}</span>
        </div>
    );
}

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [range, setRange] = useState<"7d" | "30d" | "90d">("7d");
    const analytics = useAnalytics(user?.id, range);
    const dashboardStats = useDashboardMetrics(user?.id);
    const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

    const { isLoading } = analytics;

    // Trigger achievement check and increment views
    useEffect(() => {
        if (user?.id) {
            // Securely increment analytics_views and check achievements via API
            fetch("/api/achievements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    action: "increment",
                    metric: "analytics_views"
                })
            }).catch(console.error);

            fetch("/api/achievements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id })
            }).catch(console.error);
        }
    }, [user?.id]);

    const model = analytics.data;
    const loading = isLoading && !analytics.data;

    const mobileKPIs = useMemo(() => {
        return [
            { label: "Command", value: `${model?.avgCommandScore ?? "0.0"}%`, color: "focus" as const },
            { label: "Exe Gap", value: `${model?.avgExecutionGap ?? "0"}m`, color: "warning" as const },
            { label: "At Risk", value: `${model?.atRiskHabitsCount ?? "0"}`, color: "calibration" as const }
        ];
    }, [model?.avgCommandScore, model?.avgExecutionGap, model?.atRiskHabitsCount]);

    useRegisterKPIs(mobileKPIs);

    return (
        <PageFrame
            header={
                <SectionHeader
                    title="Analytics"
                    description="Measure outcomes."
                    icon={<BarChart3 className="h-5 w-5" />}
                    actions={
                        <div className="flex gap-2">
                            {(["7d", "30d", "90d"] as const).map((preset) => (
                                <Button
                                    key={preset}
                                    size="sm"
                                    variant={range === preset ? "default" : "outline"}
                                    onClick={() => setRange(preset)}
                                >
                                    {preset}
                                </Button>
                            ))}
                        </div>
                    }
                />
            }
        >
            {/* Mobile Snapshot (Hidden, use Overlay instead) */}
            <section className="col-span-full rounded-xl border border-border/80 bg-card/85 p-3 hidden lg:block md:hidden">
                <h2 className="text-sm font-semibold mb-2">Snapshot</h2>
                <div className="grid grid-cols-3 gap-2">
                    <article className="rounded-lg border border-border/70 bg-background/60 p-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] text-muted-foreground">Command</p>
                            {model && <TrendIndicator trend={model.commandTrendDirection} />}
                        </div>
                        {loading ? (
                            <Skeleton className="mt-1 h-7 w-16" />
                        ) : (
                            <p className="mt-1 text-xl font-semibold tabular-nums text-primary">
                                {model?.avgCommandScore}%
                            </p>
                        )}
                    </article>
                    <article className="rounded-lg border border-border/70 bg-background/60 p-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] text-muted-foreground">Avg Gap</p>
                        </div>
                        {loading ? (
                            <Skeleton className="mt-1 h-7 w-16" />
                        ) : (
                            <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--k-gold)]">
                                {model?.avgExecutionGap}m
                            </p>
                        )}
                    </article>
                    <article className="rounded-lg border border-border/70 bg-background/60 p-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] text-muted-foreground">At Risk</p>
                        </div>
                        {loading ? (
                            <Skeleton className="mt-1 h-7 w-16" />
                        ) : (
                            <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--k-red)]">
                                {model?.atRiskHabitsCount}
                            </p>
                        )}
                    </article>
                </div>
            </section>

            {/* Dashboard Overview Stats */}
            <section className="col-span-full mb-2">
                <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-card/40 p-4 backdrop-blur-xl overflow-x-auto hide-scrollbar">
                    <TasksGraph
                        pending={dashboardStats.data?.pendingTaskCount ?? 0}
                        completed={dashboardStats.data?.completedTasks ?? 0}
                        overdue={dashboardStats.data?.overdueTasks ?? 0}
                    />
                    <HabitStatCard
                        habits={dashboardStats.data?.habitRows ?? []}
                        h={dashboardStats.data?.habitRows?.find(h => h.id === selectedHabitId) || dashboardStats.data?.habitRows?.[0] || null}
                        onSelect={setSelectedHabitId}
                    />
                    <LogStatCard
                        logged={dashboardStats.data?.loggedDays ?? 0}
                        missed={dashboardStats.data?.missedDays ?? 0}
                        accountability={dashboardStats.data?.avgAccountability ?? 0}
                        energy={dashboardStats.data?.avgEnergy ?? 0}
                    />
                    <NoteStatCard
                        completed={dashboardStats.data?.notesCompleted ?? 0}
                        pending={dashboardStats.data?.notesPending ?? 0}
                        pinned={dashboardStats.data?.notesPinned ?? 0}
                    />
                    <TrackStatCard
                        total={dashboardStats.data?.totalVisitsToday ?? 0}
                        top={dashboardStats.data?.topVisit ?? { name: "N/A", count: 0 }}
                    />
                </div>
            </section>

            {/* Mobile Command Trend */}
            <section className="col-span-full rounded-xl border border-border/80 bg-card/85 p-3 md:hidden">
                <h2 className="text-sm font-semibold mb-2">Command Trend</h2>
                {loading ? <Skeleton className="h-[220px] w-full rounded-xl" /> : (
                    <div className="h-[220px] w-full">
                        <CommandScoreArea data={model?.commandTrend ?? []} />
                    </div>
                )}
            </section>

            {/* Desktop Charts - Command Focus */}
            <section className="hidden col-span-full rounded-xl border border-border/80 bg-card/85 p-3 md:block lg:col-span-full">
                <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Command vs. Discipline
                </h2>
                {loading ? <Skeleton className="h-[260px] w-full rounded-xl" /> : (
                    <div className="h-[260px] w-full">
                        <CommandScoreArea data={model?.commandTrend ?? []} />
                    </div>
                )}
            </section>

            <section className="col-span-full rounded-xl border border-border/80 bg-card/85 p-3 md:col-span-6 lg:col-span-7">
                <h2 className="text-sm font-semibold mb-2">Execution Gap (Discipline)</h2>
                {loading ? <Skeleton className="h-[260px] w-full rounded-xl" /> : (
                    <div className="h-[260px] w-full">
                        <ExecutionGapBar data={model?.executionGap ?? []} />
                    </div>
                )}
            </section>

            <section className="col-span-full rounded-xl border border-border/80 bg-card/85 p-3 md:col-span-6 lg:col-span-5">
                <h2 className="text-sm font-semibold mb-2">Category ROI</h2>
                {loading ? <Skeleton className="h-[260px] w-full rounded-xl" /> : (
                    <div className="h-[260px] w-full">
                        <CategoryROIScatter data={model?.categoryROI ?? []} />
                    </div>
                )}
            </section>

            {/* Habit Risk Analysis */}
            <section className="col-span-full rounded-xl border border-border/80 bg-card/85 p-4 lg:col-span-12">
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-[var(--k-red)]" /> At-Risk Habits (Decay Warning)
                </h2>
                {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : model && model.habitRisk.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {model.habitRisk.slice(0, 6).map(habit => (
                            <article key={habit.habitId} className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 p-3">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-foreground truncate max-w-[120px]">{habit.name}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{habit.recentMisses} recent misses</span>
                                </div>
                                <div className="flex items-center justify-center h-10 w-10 rounded-full border border-border/60 bg-background shadow-inner">
                                    <span className={cn(
                                        "text-xs font-bold",
                                        habit.riskScore > 75 ? "text-[var(--k-red)]" : habit.riskScore > 40 ? "text-[var(--k-orange)]" : "text-[var(--k-green)]"
                                    )}>
                                        {habit.riskScore}
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No habits currently at risk.</p>
                )}
            </section>
        </PageFrame>
    );
}
