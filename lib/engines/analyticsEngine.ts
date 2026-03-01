import { parseISO } from "date-fns";

export interface ExecutionGapPoint {
    date: string;
    plannedMinutes: number;
    actualMinutes: number;
    gapMinutes: number; // planned - actual
}

export interface HabitRisk {
    habitId: string;
    name: string;
    riskScore: number; // 0-100, higher is worse (decaying)
    recentMisses: number;
    avgEnergy: number;
}

export interface CategoryROI {
    category: string;
    timeSpentMinutes: number;
    tasksCompleted: number;
    roiScore: number; // Tasks per hour invested, or similar logic
    color: string;
}

export interface CommandTrendPoint {
    date: string;
    commandScore: number; // 0-100 aggregated score
    disciplineScore: number;
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
    timeBlocks: Array<{ start_time: string; end_time: string }>;
    habits: Array<{ id: string; name: string; relapse_count: number }>;
    completions: Array<{ habit_id: string; completion_date: string; }>;
    tasks: Array<{ id: string; completed_at: string | null; created_at: string }>;
}

export interface AnalyticsViewModel {
    executionGap: ExecutionGapPoint[];
    habitRisk: HabitRisk[];
    categoryROI: CategoryROI[];
    commandTrend: CommandTrendPoint[];

    // Top-line KPIs
    avgCommandScore: number;
    avgExecutionGap: number; // Avg minutes missed per day
    atRiskHabitsCount: number;
    commandTrendDirection: "improving" | "worsening" | "stable";
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
    // 1. Execution Gap
    const gapMap = new Map<string, ExecutionGapPoint>();

    // Initialize with dates from time blocks
    rawRows.timeBlocks.forEach(tb => {
        const d = normalizeDate(tb.start_time.slice(0, 10), timezone);
        const existing = gapMap.get(d) || { date: d, plannedMinutes: 0, actualMinutes: 0, gapMinutes: 0 };

        const start = new Date(tb.start_time).getTime();
        const end = new Date(tb.end_time).getTime();
        const durationMins = Math.max(0, (end - start) / 60000);

        // Since we don't have separate planned/actual stored explicitly, we'll
        // consider the scheduled block as planned, and use an arbitrary execution rate
        // proxy for the dashboard demo, or use log data to derive actual execution.
        // For a true fix, `actual_duration` would need to be stored on time_blocks.
        existing.plannedMinutes += durationMins;

        gapMap.set(d, existing);
    });

    // As a proxy for 'actual', we will map logged study/work time against planned blocks
    rawRows.logs.forEach(l => {
        const d = normalizeDate(l.date, timezone);
        if (gapMap.has(d)) {
            const existing = gapMap.get(d)!;
            const actualTotal = l.study_minutes + l.workout_minutes + (l.screen_minutes * 0.2); // Rough proxy for 'executed'
            existing.actualMinutes = actualTotal;
            existing.gapMinutes = existing.plannedMinutes - existing.actualMinutes;
        }
    });

    const executionGap = Array.from(gapMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Average Execution Gap
    const avgExecutionGap = executionGap.length > 0
        ? executionGap.reduce((sum, g) => sum + Math.max(0, g.gapMinutes), 0) / executionGap.length
        : 0;

    // 2. Habit Risk
    const habitRisk: HabitRisk[] = rawRows.habits.map(h => {
        const comps = rawRows.completions.filter(c => c.habit_id === h.id);

        // Find misses in the last 7 days roughly by looking at completion density
        // A simpler proxy: how many completions in the rawRows timeframe vs days length
        const daysInPeriod = new Set(rawRows.discipline.map(d => normalizeDate(d.date, timezone))).size || 30;
        const compCount = comps.length;
        const recentMisses = Math.max(0, daysInPeriod - compCount);

        // Without energy tracking, we rely entirely on miss rate for risk.
        // If a habit misses 50% of the days, it has max risk (100).
        const missFactor = Math.min(100, (recentMisses / (daysInPeriod * 0.5)) * 100);

        const riskScore = Math.min(100, missFactor);

        return {
            habitId: h.id,
            name: h.name,
            riskScore: Number(riskScore.toFixed(0)),
            recentMisses,
            avgEnergy: 0
        };
    }).sort((a, b) => b.riskScore - a.riskScore);

    const atRiskHabitsCount = habitRisk.filter(h => h.riskScore > 50).length;

    // 3. Category ROI
    const categoryStats = new Map<string, { timeSpent: number, tasksDone: number }>();

    // Time spent approximated from tasks and logs (using logs for general categories logic)
    // Actually, let's use tasks completed per category vs. total tasks to keep it simple, or map logs to categories if possible.
    // We'll group tasks by category.
    const validCategories = ["growth", "operations", "learning", "health"];

    validCategories.forEach(cat => {
        categoryStats.set(cat, { timeSpent: 0, tasksDone: 0 });
    });

    // Since tasks don't have explicit categories in DB right now,
    // we randomly distribute completed tasks into 'operations' and 'growth' for proof of concept.
    // In a real scenario, we'd need a tracking_categories mapping.
    rawRows.tasks.forEach((t, index) => {
        const cat = index % 3 === 0 ? "growth" : "operations";
        const stat = categoryStats.get(cat)!;
        if (t.completed_at) {
            stat.tasksDone += 1;
        }
    });

    // Approximate time spent from logs
    let totalStudy = 0, totalWorkout = 0, totalScreen = 0;
    rawRows.logs.forEach(l => {
        totalStudy += l.study_minutes;
        totalWorkout += l.workout_minutes;
        totalScreen += l.screen_minutes;
    });

    // Map log time to rough categories
    if (categoryStats.has("learning")) categoryStats.get("learning")!.timeSpent = totalStudy;
    if (categoryStats.has("health")) categoryStats.get("health")!.timeSpent = totalWorkout;
    if (categoryStats.has("operations")) categoryStats.get("operations")!.timeSpent = totalScreen * 0.2; // some screen time is ops

    const categoryROI: CategoryROI[] = Array.from(categoryStats.entries())
        .map(([cat, stats]) => {
            const timeHours = stats.timeSpent / 60;
            // ROI = tasks per hour (if time is 0, just use tasks * 2 as a baseline)
            const roiScore = timeHours > 0 ? stats.tasksDone / timeHours : stats.tasksDone * 2;

            return {
                category: cat,
                timeSpentMinutes: stats.timeSpent,
                tasksCompleted: stats.tasksDone,
                roiScore: Number(roiScore.toFixed(2)),
                color: `var(--k-${cat === 'health' ? 'green' : cat === 'learning' ? 'blue' : cat === 'growth' ? 'gold' : 'purple'})`
            };
        })
        .filter(c => c.timeSpentMinutes > 0 || c.tasksCompleted > 0)
        .sort((a, b) => b.roiScore - a.roiScore);

    // 4. Command Score
    const commandTrendMap = new Map<string, CommandTrendPoint>();

    rawRows.discipline.forEach(d => {
        const dStr = normalizeDate(d.date, timezone);
        commandTrendMap.set(dStr, { date: dStr, disciplineScore: d.score, commandScore: d.score });
    });

    // Adjust command score based on execution gap for that day
    Array.from(commandTrendMap.entries()).forEach(([date, point]) => {
        const gap = gapMap.get(date);
        let commandMod = point.disciplineScore;

        if (gap && gap.plannedMinutes > 0) {
            const executionRate = Math.min(1, gap.actualMinutes / gap.plannedMinutes);
            // Blend discipline score with execution rate
            commandMod = (point.disciplineScore * 0.6) + ((executionRate * 100) * 0.4);
        }

        point.commandScore = Number(commandMod.toFixed(1));
    });

    const commandTrend = Array.from(commandTrendMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    const avgCommandScore = commandTrend.length > 0
        ? commandTrend.reduce((sum, p) => sum + p.commandScore, 0) / commandTrend.length
        : 0;

    let commandTrendDirection: "improving" | "worsening" | "stable" = "stable";
    if (commandTrend.length > 6) {
        const mid = Math.floor(commandTrend.length / 2);
        const firstHalf = commandTrend.slice(0, mid).reduce((sum, p) => sum + p.commandScore, 0) / mid;
        const secondHalf = commandTrend.slice(mid).reduce((sum, p) => sum + p.commandScore, 0) / (commandTrend.length - mid);
        if (secondHalf > firstHalf + 2) commandTrendDirection = "improving";
        else if (secondHalf < firstHalf - 2) commandTrendDirection = "worsening";
    }

    return {
        executionGap,
        habitRisk,
        categoryROI,
        commandTrend,
        avgCommandScore: Number(avgCommandScore.toFixed(1)),
        avgExecutionGap: Number(avgExecutionGap.toFixed(0)),
        atRiskHabitsCount,
        commandTrendDirection
    };
}

