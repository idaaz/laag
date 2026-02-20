"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, Minus, PieChart } from "lucide-react";
import { PageFrame } from "@/components/structure/PageFrame";
import { SectionHeader } from "@/components/structure/SectionHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InsightCard } from "@/components/analytics/InsightCard";
import { useAuth } from "@/hooks/useAuth";
import { useAnalytics } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";
import { useRegisterKPIs } from "@/lib/context/MobileKPIContext";
import { FloatingActionButton } from "@/components/structure/FloatingActionButton";
import { useRouter } from "next/navigation";

const XPLineChart = dynamic(() => import("@/components/charts/XPLineChart").then((m) => m.XPLineChart));
const RadarLifeBalance = dynamic(() =>
    import("@/components/charts/RadarLifeBalance").then((m) => m.RadarLifeBalance)
);
const HeatmapCalendar = dynamic(() =>
    import("@/components/charts/HeatmapCalendar").then((m) => m.HeatmapCalendar)
);
const MoodLineChart = dynamic(() =>
    import("@/components/charts/MoodLineChart").then((m) => m.MoodLineChart)
);
const ScreenStudyArea = dynamic(() =>
    import("@/components/charts/ScreenStudyArea").then((m) => m.ScreenStudyArea)
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
    const router = useRouter();
    const [range, setRange] = useState<"7d" | "30d" | "90d">("7d");
    const analytics = useAnalytics(user?.id, range);
    const { isLoading } = analytics;

    // Trigger achievement check and increment views
    useEffect(() => {
        if (user?.id) {
            import("@/lib/engines/achievementEngine").then(({ checkAndUnlockAchievements, incrementAchievementProgress }) => {
                incrementAchievementProgress(user.id, "analytics_views", 1).catch(console.error);
                checkAndUnlockAchievements(user.id).catch(console.error);
            });
        }
    }, [user?.id]);

    const model = analytics.data;
    const loading = isLoading && !analytics.data;

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
            <div className="hidden">
                {(() => {
                    const kpis = [
                        { label: "Burnout", value: model?.burnoutIndex.toFixed(1) ?? "0.0", color: "warning" as const },
                        { label: "Overconfidence", value: model?.overconfidenceIndex.toFixed(1) ?? "0.0", color: "calibration" as const },
                        { label: "Productivity", value: model?.productivityTrend?.averageProductivity.toFixed(0) ?? "0", color: "focus" as const }
                    ];
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    useRegisterKPIs(kpis);
                    return null;
                })()}
            </div>
            {/* Mobile Snapshot (Hidden, use Overlay instead) */}
            <section className="col-span-full rounded-xl border border-border/80 bg-card/85 p-3 hidden lg:block md:hidden">
                <h2 className="text-sm font-semibold mb-2">Snapshot</h2>
                <div className="grid grid-cols-2 gap-2">
                    <article className="rounded-lg border border-border/70 bg-background/60 p-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] text-muted-foreground">Burnout</p>
                            {model && <TrendIndicator trend={model.burnoutTrend} />}
                        </div>
                        {loading ? (
                            <Skeleton className="mt-1 h-7 w-16" />
                        ) : (
                            <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--k-orange)]">
                                {model?.burnoutIndex.toFixed(1) ?? "0.0"}
                            </p>
                        )}
                    </article>
                    <article className="rounded-lg border border-border/70 bg-background/60 p-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] text-muted-foreground">Overconfidence</p>
                            {model && <TrendIndicator trend={model.overconfidenceTrend} />}
                        </div>
                        {loading ? (
                            <Skeleton className="mt-1 h-7 w-16" />
                        ) : (
                            <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--k-purple)]">
                                {model?.overconfidenceIndex.toFixed(1) ?? "0.0"}
                            </p>
                        )}
                    </article>
                </div>
            </section>

            {/* Mobile XP Trend */}
            <section className="col-span-full rounded-xl border border-border/80 bg-card/85 p-3 md:hidden">
                <h2 className="text-sm font-semibold mb-2">XP Trend</h2>
                {loading ? <Skeleton className="h-[220px] w-full rounded-xl" /> : <XPLineChart data={model?.xpGrowth ?? []} />}
            </section>

            {/* Productivity Insights (New) */}
            {model?.productivityTrend && (
                <section className="col-span-full rounded-xl border border-border/80 bg-card/85 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <h2 className="text-sm font-semibold">Productivity Insights</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <InsightCard
                            title="Avg Productivity"
                            value={model.productivityTrend.averageProductivity}
                            subtitle="Daily average"
                            icon={BarChart3}
                            tone="focus"
                            trend={model.productivityTrend.weekOverWeekChange > 0 ? "up" : model.productivityTrend.weekOverWeekChange < 0 ? "down" : "neutral"}
                            trendValue={`${model.productivityTrend.weekOverWeekChange > 0 ? "+" : ""}${model.productivityTrend.weekOverWeekChange}%`}
                        />
                        <InsightCard
                            title="Best Day"
                            value={model.productivityTrend.bestDay?.productivity.toFixed(1) ?? "N/A"}
                            subtitle={model.productivityTrend.bestDay?.date ?? "No data"}
                            icon={TrendingUp}
                            tone="focus"
                        />
                        <InsightCard
                            title="Category Balance"
                            value={model.categoryBreakdown[0]?.category ?? "N/A"}
                            subtitle={`${Math.round(model.categoryBreakdown[0]?.percentage ?? 0)}% of time`}
                            icon={PieChart}
                            tone="info"
                        />
                    </div>

                    {/* Category Breakdown */}
                    {model.categoryBreakdown.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-xs font-medium text-muted-foreground mb-2">Time Distribution</h3>
                            <div className="flex flex-wrap gap-2">
                                {model.categoryBreakdown.map((cat) => (
                                    <div
                                        key={cat.category}
                                        className="rounded-full border border-border/60 bg-background/40 px-3 py-1.5 text-xs font-medium"
                                    >
                                        <span
                                            className="inline-block w-2 h-2 rounded-full mr-1.5"
                                            style={{ backgroundColor: cat.color }}
                                        />
                                        {cat.category}: {Math.round(cat.minutes)}m ({Math.round(cat.percentage)}%)
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* Desktop Charts */}
            <section className="hidden col-span-full rounded-xl border border-border/80 bg-card/85 p-3 md:block lg:col-span-8">
                <h2 className="text-sm font-semibold mb-2">XP</h2>
                {loading ? <Skeleton className="h-[260px] w-full rounded-xl" /> : <XPLineChart data={model?.xpGrowth ?? []} />}
            </section>

            <section className="hidden col-span-full rounded-xl border border-border/80 bg-card/85 p-3 md:block lg:col-span-4">
                <h2 className="text-sm font-semibold mb-2">Balance</h2>
                {loading ? <Skeleton className="h-[260px] w-full rounded-xl" /> : <RadarLifeBalance data={model?.radar ?? []} />}
            </section>

            <section className="hidden col-span-full rounded-xl border border-border/80 bg-card/85 p-3 md:block lg:col-span-7">
                <h2 className="text-sm font-semibold mb-2">Heat</h2>
                {loading ? <Skeleton className="h-[260px] w-full rounded-xl" /> : <HeatmapCalendar data={model?.heatmap ?? []} />}
            </section>

            <section className="hidden col-span-full rounded-xl border border-border/80 bg-card/85 p-3 md:block lg:col-span-5">
                <h2 className="text-sm font-semibold mb-2">Screen vs Study</h2>
                {loading ? <Skeleton className="h-[260px] w-full rounded-xl" /> : <ScreenStudyArea data={model?.screenVsStudy ?? []} />}
            </section>

            <section className="hidden col-span-full rounded-xl border border-border/80 bg-card/85 p-3 md:block lg:col-span-7">
                <h2 className="text-sm font-semibold mb-2">Mood vs Output</h2>
                {loading ? <Skeleton className="h-[260px] w-full rounded-xl" /> : <MoodLineChart data={model?.moodProductivity ?? []} />}
            </section>

            {/* Enhanced Burnout & Overconfidence Cards */}
            <section className="hidden col-span-full grid-cols-1 gap-3 md:grid md:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
                <article className="rounded-xl border border-border/80 bg-card/85 p-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Burnout</p>
                        {model && <TrendIndicator trend={model.burnoutTrend} />}
                    </div>
                    {loading ? (
                        <Skeleton className="h-10 w-20 mt-1" />
                    ) : (
                        <p className="text-3xl font-semibold mt-1 tabular-nums text-[var(--k-orange)]">
                            {model?.burnoutIndex.toFixed(1) ?? "0.0"}
                        </p>
                    )}
                </article>
                <article className="rounded-xl border border-border/80 bg-card/85 p-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Overconfidence</p>
                        {model && <TrendIndicator trend={model.overconfidenceTrend} />}
                    </div>
                    {loading ? (
                        <Skeleton className="h-10 w-20 mt-1" />
                    ) : (
                        <p className="text-3xl font-semibold mt-1 tabular-nums text-[var(--k-purple)]">
                            {model?.overconfidenceIndex.toFixed(1) ?? "0.0"}
                        </p>
                    )}
                </article>
            </section>

            <FloatingActionButton
                label="New Insight"
                onClick={() => router.push("/notes?action=new&type=insight" as never)}
            />
        </PageFrame>
    );
}
