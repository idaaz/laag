import { parseISO } from "date-fns";

export interface XPPoint {
    date: string;
    xp: number;
}

export interface RadarPoint {
    domain: "Health" | "Mind" | "Money" | "Discipline" | "Focus";
    value: number;
}

export interface HeatmapPoint {
    date: string;
    intensity: number;
}

export interface CategoryTimeBreakdown {
    category: string;
    minutes: number;
    percentage: number;
    color: string;
}

export interface ProductivityTrend {
    weekOverWeekChange: number; // Percentage change
    bestDay: { date: string; productivity: number } | null;
    worstDay: { date: string; productivity: number } | null;
    averageProductivity: number;
}

export interface AnalyticsRawRows {
    xpDaily: Array<{ date: string; xp_total: number }>;
    discipline: Array<{ date: string; score: number }>;
    logs: Array<{
        date: string;
        study_minutes: number;
        workout_minutes: number;
        sleep_hours: number;
        screen_minutes: number;
        mood: number;
        productivity: number;
    }>;
}

export interface AnalyticsViewModel {
    xpGrowth: XPPoint[];
    moodProductivity: Array<{ date: string; mood: number; productivity: number }>;
    screenVsStudy: Array<{ date: string; studyHours: number; screenHours: number }>;
    radar: RadarPoint[];
    heatmap: HeatmapPoint[];
    burnoutIndex: number;
    overconfidenceIndex: number;
    burnoutTrend: "improving" | "worsening" | "stable";
    overconfidenceTrend: "improving" | "worsening" | "stable";
    productivityTrend: ProductivityTrend;
    categoryBreakdown: CategoryTimeBreakdown[];
}

function normalizeDate(date: string, timezone: string): string {
    const fmt = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });
    const parts = fmt.formatToParts(parseISO(date));
    const year = parts.find((part) => part.type === "year")?.value ?? "1970";
    const month = parts.find((part) => part.type === "month")?.value ?? "01";
    const day = parts.find((part) => part.type === "day")?.value ?? "01";
    return `${year}-${month}-${day}`;
}

function calculateTrend(recentValue: number, previousValue: number): "improving" | "worsening" | "stable" {
    const change = recentValue - previousValue;
    if (Math.abs(change) < 5) return "stable";
    return change > 0 ? "worsening" : "improving"; // Lower burnout/overconfidence is better
}

export function buildAnalyticsSeries(
    rawRows: AnalyticsRawRows,
    timezone: string
): AnalyticsViewModel {
    const xpGrowth = rawRows.xpDaily.map((row) => ({
        date: normalizeDate(row.date, timezone),
        xp: row.xp_total
    }));

    const moodProductivity = rawRows.logs.map((row) => ({
        date: normalizeDate(row.date, timezone),
        mood: row.mood,
        productivity: row.productivity
    }));

    const screenVsStudy = rawRows.logs.map((row) => ({
        date: normalizeDate(row.date, timezone),
        studyHours: Number((row.study_minutes / 60).toFixed(2)),
        screenHours: Number((row.screen_minutes / 60).toFixed(2))
    }));

    const activityTotals = rawRows.logs.reduce(
        (acc, row) => {
            acc.health += row.workout_minutes + Math.max(0, 8 - Math.abs(8 - row.sleep_hours) * 2);
            acc.mind += row.study_minutes + row.mood * 10;
            acc.money += row.productivity * 8;
            acc.discipline += row.productivity * 9;
            acc.focus += Math.max(0, row.study_minutes - row.screen_minutes * 0.25);
            acc.sleep += row.sleep_hours;
            acc.study += row.study_minutes;
            acc.screen += row.screen_minutes;
            acc.productivity += row.productivity;
            return acc;
        },
        {
            health: 0,
            mind: 0,
            money: 0,
            discipline: 0,
            focus: 0,
            sleep: 0,
            study: 0,
            screen: 0,
            productivity: 0
        }
    );

    const count = Math.max(rawRows.logs.length, 1);
    const radar: RadarPoint[] = [
        { domain: "Health", value: Math.min(100, activityTotals.health / count) },
        { domain: "Mind", value: Math.min(100, activityTotals.mind / count) },
        { domain: "Money", value: Math.min(100, activityTotals.money / count) },
        { domain: "Discipline", value: Math.min(100, activityTotals.discipline / count) },
        { domain: "Focus", value: Math.min(100, activityTotals.focus / count) }
    ];

    const maxXP = Math.max(1, ...xpGrowth.map((point) => point.xp));
    const heatmap = xpGrowth.map((point) => ({
        date: point.date,
        intensity: Number((point.xp / maxXP).toFixed(2))
    }));

    const avgSleep = activityTotals.sleep / count;
    const avgStudy = activityTotals.study / count;
    const avgScreen = activityTotals.screen / count;
    const avgProductivity = activityTotals.productivity / count;
    const completedTaskProxy = xpGrowth.reduce((sum, point) => sum + point.xp, 0) / count / 10;

    const burnoutIndex = Math.min(
        100,
        Math.max(0, (6.5 - avgSleep) * 18 + (avgStudy / 60) * 7 + (avgScreen / 60) * 6)
    );
    const overconfidenceIndex = Math.min(
        100,
        Math.max(0, avgProductivity * 10 - completedTaskProxy * 12)
    );

    // Trend calculation (compare first half vs second half)
    const midPoint = Math.floor(rawRows.logs.length / 2);
    const firstHalf = rawRows.logs.slice(0, midPoint);
    const secondHalf = rawRows.logs.slice(midPoint);

    const calcBurnout = (logs: typeof rawRows.logs) => {
        if (logs.length === 0) return 0;
        const avgS = logs.reduce((sum, l) => sum + l.sleep_hours, 0) / logs.length;
        const avgSt = logs.reduce((sum, l) => sum + l.study_minutes, 0) / logs.length;
        const avgSc = logs.reduce((sum, l) => sum + l.screen_minutes, 0) / logs.length;
        return Math.min(100, Math.max(0, (6.5 - avgS) * 18 + (avgSt / 60) * 7 + (avgSc / 60) * 6));
    };

    const calcOverconfidence = (logs: typeof rawRows.logs) => {
        if (logs.length === 0) return 0;
        const avgP = logs.reduce((sum, l) => sum + l.productivity, 0) / logs.length;
        return Math.min(100, Math.max(0, avgP * 10 - completedTaskProxy * 12));
    };

    const firstHalfBurnout = calcBurnout(firstHalf);
    const secondHalfBurnout = calcBurnout(secondHalf);
    const firstHalfOverconf = calcOverconfidence(firstHalf);
    const secondHalfOverconf = calcOverconfidence(secondHalf);

    const burnoutTrend = calculateTrend(secondHalfBurnout, firstHalfBurnout);
    const overconfidenceTrend = calculateTrend(secondHalfOverconf, firstHalfOverconf);

    // Productivity trend
    const sortedByProductivity = [...rawRows.logs].sort((a, b) => b.productivity - a.productivity);
    const bestDay = sortedByProductivity[0]
        ? { date: normalizeDate(sortedByProductivity[0].date, timezone), productivity: sortedByProductivity[0].productivity }
        : null;
    const worstDay = sortedByProductivity[sortedByProductivity.length - 1]
        ? {
            date: normalizeDate(sortedByProductivity[sortedByProductivity.length - 1].date, timezone),
            productivity: sortedByProductivity[sortedByProductivity.length - 1].productivity
        }
        : null;

    const weekOverWeekChange =
        firstHalf.length > 0 && secondHalf.length > 0
            ? ((secondHalf.reduce((sum, l) => sum + l.productivity, 0) / secondHalf.length -
                firstHalf.reduce((sum, l) => sum + l.productivity, 0) / firstHalf.length) /
                (firstHalf.reduce((sum, l) => sum + l.productivity, 0) / firstHalf.length)) *
            100
            : 0;

    const productivityTrend: ProductivityTrend = {
        weekOverWeekChange: Number(weekOverWeekChange.toFixed(1)),
        bestDay,
        worstDay,
        averageProductivity: Number(avgProductivity.toFixed(1))
    };

    // Category breakdown
    const totalMinutes = activityTotals.study + activityTotals.screen + activityTotals.health;
    const categoryBreakdown: CategoryTimeBreakdown[] = [
        {
            category: "Education",
            minutes: activityTotals.study,
            percentage: totalMinutes > 0 ? (activityTotals.study / totalMinutes) * 100 : 0,
            color: "hsl(var(--chart-1))"
        },
        {
            category: "Entertainment",
            minutes: activityTotals.screen,
            percentage: totalMinutes > 0 ? (activityTotals.screen / totalMinutes) * 100 : 0,
            color: "hsl(var(--chart-4))"
        },
        {
            category: "Health",
            minutes: activityTotals.health,
            percentage: totalMinutes > 0 ? (activityTotals.health / totalMinutes) * 100 : 0,
            color: "hsl(var(--chart-2))"
        }
    ].filter(cat => cat.minutes > 0);

    return {
        xpGrowth,
        moodProductivity,
        screenVsStudy,
        radar,
        heatmap,
        burnoutIndex,
        overconfidenceIndex,
        burnoutTrend,
        overconfidenceTrend,
        productivityTrend,
        categoryBreakdown
    };
}

