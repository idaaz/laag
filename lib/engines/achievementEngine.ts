/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type {
    AchievementRow,
    AchievementProgressRow,
    TaskRow,
    HabitRow,
    TimerRow,
    DailyLogRow,
    UserRow
} from "@/lib/supabase/types";

// Unlock condition structure
export interface UnlockCondition {
    type: 'count' | 'streak' | 'threshold' | 'ratio' | 'complex';
    metric: string;
    comparison: '>=' | '<=' | '==' | '>';
    target: number;
    timeframe?: '1d' | '7d' | '30d' | 'all_time';
}

// User stats for achievement checking
export interface UserStats {
    // Tasks
    tasks_completed: number;
    tasks_completed_today: number;
    high_priority_tasks_completed: number;
    before_deadline_completions: number;
    late_night_completions: number;
    early_morning_completions: number;

    // Habits
    habits_created: number;
    habit_max_streak: number;
    active_habits: number;
    relapse_recoveries: number;

    // Productivity
    total_xp: number;
    xp_in_one_day: number;
    xp_in_one_week: number;
    pomodoro_completions: number;

    // Analytics
    analytics_views: number;
    all_radar_above_70: number;
    focus_score_7d: number;
    burnout_index: number;
    productivity_wow_change: number;

    // Wellness
    daily_logs_completed: number;
    daily_log_streak: number;
    study_minutes_one_day: number;
    workout_minutes_one_day: number;

    // Milestones
    app_usage_streak: number;
    days_since_signup: number;

    // Special
    midnight_activities: number;
    truth_mode_activations: number;
}

/**
 * Fetch user statistics for achievement checking
 */
export async function getUserStats(supabase: SupabaseClient<Database>, userId: string): Promise<UserStats> {
    const today = new Date().toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
        tasksResult,
        habitsResult,
        xpResult,
        timersResult,
        logsResult,
        userResult,
        analyticsProgressResult
    ] = await Promise.all([
        // Tasks stats
        supabase.from("tasks").select("*").eq("user_id", userId).eq("status", "completed"),

        // Habits stats
        supabase.from("habits").select("*").eq("user_id", userId),

        // XP stats
        supabase.from("xp_events").select("delta_xp, created_at").eq("user_id", userId),

        // Timer/Pomodoro stats
        supabase.from("timers").select("*").eq("user_id", userId).eq("session_type", "pomodoro").eq("completed", true),

        // Daily logs stats
        supabase.from("daily_logs").select("*").eq("user_id", userId).order("log_date", { ascending: false }),

        // User info
        supabase.from("users").select("created_at, truth_mode_count").eq("id", userId).single(),

        // Achievements stats (views etc)
        supabase.from("achievement_progress").select("current_value").eq("user_id", userId).eq("achievement_code", "data_enthusiast").single()
    ]);

    const tasks = (tasksResult.data as unknown as TaskRow[]) ?? [];
    const habits = (habitsResult.data as unknown as HabitRow[]) ?? [];
    const xpEvents = (xpResult.data as unknown as Array<{ delta_xp: number; created_at: string }>) ?? [];
    const timers = (timersResult.data as unknown as TimerRow[]) ?? [];
    const logs = (logsResult.data as unknown as DailyLogRow[]) ?? [];
    const user = userResult.data as unknown as UserRow;
    const analyticsProgress = analyticsProgressResult.data as unknown as AchievementProgressRow;

    // Calculate comprehensive stats
    const totalXP = xpEvents.reduce((sum, e) => sum + e.delta_xp, 0);
    const todayTasks = tasks.filter(t => t.completed_at?.startsWith(today)).length;
    const maxStreak = Math.max(0, ...habits.map(h => h.longest_streak));
    const activeHabits = habits.filter(h => h.is_active).length;

    // Daily log streak calculation
    let dailyLogStreak = 0;
    if (logs.length > 0) {
        const sortedLogs = [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date));
        for (let i = 0; i < sortedLogs.length; i++) {
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() - i);
            const expected = expectedDate.toISOString().slice(0, 10);
            if (sortedLogs[i].log_date === expected) {
                dailyLogStreak++;
            } else {
                break;
            }
        }
    }

    // App usage streak (simplified - based on daily logs)
    const appUsageStreak = dailyLogStreak;

    // Days since signup
    const daysSinceSignup = user
        ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (24 * 60 * 60 * 1000))
        : 0;

    const stats: UserStats = {
        tasks_completed: tasks.length,
        tasks_completed_today: todayTasks,
        high_priority_tasks_completed: tasks.filter(t => t.priority === 'high' || t.priority === 'critical').length,
        before_deadline_completions: tasks.filter(t => t.deadline_at && t.completed_at && t.completed_at < t.deadline_at).length,
        late_night_completions: tasks.filter(t => {
            const hour = t.completed_at ? new Date(t.completed_at).getHours() : 0;
            return hour >= 23 || hour <= 4;
        }).length,
        early_morning_completions: tasks.filter(t => {
            const hour = t.completed_at ? new Date(t.completed_at).getHours() : 0;
            return hour >= 5 && hour <= 7;
        }).length,

        habits_created: habits.length,
        habit_max_streak: maxStreak,
        active_habits: activeHabits,
        relapse_recoveries: habits.reduce((sum, h) => sum + h.relapse_count, 0),

        total_xp: totalXP,
        xp_in_one_day: Math.max(0, ...groupByDate(xpEvents).map(g => g.total)),
        xp_in_one_week: xpEvents.filter(e => e.created_at >= sevenDaysAgo).reduce((sum, e) => sum + e.delta_xp, 0),
        pomodoro_completions: timers.length,

        analytics_views: analyticsProgress?.current_value ?? 0, // Track separately via page visits
        all_radar_above_70: 0, // Calculate from analytics
        focus_score_7d: 0, // Calculate from tracking data
        burnout_index: 0, // From analytics
        productivity_wow_change: 0, // From analytics

        daily_logs_completed: logs.length,
        daily_log_streak: dailyLogStreak,
        study_minutes_one_day: Math.max(0, ...logs.map(l => l.study_minutes)),
        workout_minutes_one_day: Math.max(0, ...logs.map(l => l.workout_minutes)),

        app_usage_streak: appUsageStreak,
        days_since_signup: daysSinceSignup,

        midnight_activities: tasks.filter(t => {
            const hour = t.completed_at ? new Date(t.completed_at).getHours() : 0;
            return hour >= 0 && hour <= 4;
        }).length,
        truth_mode_activations: user?.truth_mode_count ?? 0
    };

    return stats;
}

function groupByDate(events: Array<{ delta_xp: number; created_at: string }>) {
    const grouped = new Map<string, number>();
    events.forEach(e => {
        const date = e.created_at.slice(0, 10);
        grouped.set(date, (grouped.get(date) || 0) + e.delta_xp);
    });
    return Array.from(grouped.entries()).map(([date, total]) => ({ date, total }));
}

/**
 * Check if unlock condition is met
 */
export function checkUnlockCondition(condition: UnlockCondition, stats: UserStats): boolean {
    const value = stats[condition.metric as keyof UserStats] as number ?? 0;

    switch (condition.comparison) {
        case '>=':
            return value >= condition.target;
        case '<=':
            return value <= condition.target;
        case '==':
            return value === condition.target;
        case '>':
            return value > condition.target;
        default:
            return false;
    }
}

/**
 * Calculate progress toward an achievement
 */
export function calculateProgress(condition: UnlockCondition, stats: UserStats): { current: number; target: number; percentage: number } {
    const current = Math.min(stats[condition.metric as keyof UserStats] as number ?? 0, condition.target);
    const target = condition.target;
    const percentage = target > 0 ? Math.round((current / target) * 100) : 0;

    return { current, target, percentage };
}

/**
 * Check and unlock achievements for a user
 */
export async function checkAndUnlockAchievements(supabase: SupabaseClient<Database>, userId: string): Promise<AchievementRow[]> {
    try {
        // Fetch user stats
        const stats = await getUserStats(supabase, userId);

        const { data: definitions, error: defError } = await supabase
            .from("achievement_definitions")
            .select("*")
            .order("display_order");

        if (defError || !definitions) {
            console.error("Failed to fetch achievement definitions:", defError);
            return [];
        }

        // Fetch user's already unlocked achievements
        const { data: unlocked, error: unlockedError } = await supabase
            .from("achievements")
            .select("code")
            .eq("user_id", userId);

        if (unlockedError) {
            console.error("Failed to fetch unlocked achievements:", unlockedError);
            return [];
        }

        const unlockedCodes = new Set(((unlocked as any[]) ?? []).map(a => a.code));
        const newlyUnlocked: AchievementRow[] = [];

        // Check each definition
        for (const def of (definitions as any[])) {
            // Skip if already unlocked (unless repeatable)
            if (unlockedCodes.has(def.code) && !def.is_repeatable) {
                continue;
            }

            const condition = def.unlock_condition as unknown as UnlockCondition;
            const isUnlocked = checkUnlockCondition(condition, stats);

            if (isUnlocked) {
                const insertData = {
                    user_id: userId,
                    code: def.code,
                    title: def.title,
                    description: def.description,
                    unlocked_at: new Date().toISOString()
                };

                const { data: newAchievement, error: insertError } = await (supabase.from("achievements") as any)
                    .insert(insertData)
                    .select()
                    .single();

                if (!insertError && newAchievement) {
                    newlyUnlocked.push(newAchievement as AchievementRow);

                    // Create notification
                    try {
                        const { notifyAchievementUnlocked } = await import("@/lib/engines/notificationEngine");
                        await notifyAchievementUnlocked(userId, def.title, def.tier);
                    } catch (err) {
                        console.error("Failed to send achievement notification:", err);
                    }

                    // Award XP
                    const xpData = {
                        user_id: userId,
                        source_type: "achievement",
                        source_id: (newAchievement as any).id,
                        delta_xp: def.xp_reward,
                        reason: `Achievement unlocked: ${def.title}`
                    };
                    await (supabase.from("xp_events") as any).insert(xpData);
                } else if (insertError) {
                    console.error("Failed to insert unlocked achievement:", insertError);
                }
            } else {
                // Update progress
                const progress = calculateProgress(condition, stats);
                const upsertData = {
                    user_id: userId,
                    achievement_code: def.code,
                    current_value: progress.current,
                    target_value: progress.target,
                    last_updated: new Date().toISOString()
                };
                await (supabase.from("achievement_progress") as any).upsert(upsertData, {
                    onConflict: 'user_id,achievement_code'
                });
            }
        }

        return newlyUnlocked;
    } catch (error) {
        console.error("Error in checkAndUnlockAchievements:", error);
        throw error;
    }
}

/**
 * Increment progress for a specific achievement metric
 */
export async function incrementAchievementProgress(supabase: SupabaseClient<Database>, userId: string, metric: string, amount = 1) {
    try {
        // Fetch all definitions that use this metric
        const { data: definitions, error: defError } = await supabase
            .from("achievement_definitions")
            .select("code, unlock_condition");

        if (defError || !definitions) {
            console.error("Failed to fetch definitions for increment:", defError);
            return;
        }

        // Filter definitions that match the metric in their unlock_condition
        const matchingDefs = (definitions as any[]).filter(def => {
            const cond = def.unlock_condition as any;
            return cond && cond.metric === metric;
        });

        for (const def of matchingDefs) {
            const condition = def.unlock_condition as unknown as UnlockCondition;

            // Get current progress
            const { data: currentProgress } = await supabase
                .from("achievement_progress")
                .select("current_value")
                .eq("user_id", userId)
                .eq("achievement_code", def.code)
                .maybeSingle();

            const currentValue = ((currentProgress as any)?.current_value ?? 0) + amount;

            // Upsert new progress
            const upsertData = {
                user_id: userId,
                achievement_code: def.code,
                current_value: currentValue,
                target_value: condition.target,
                last_updated: new Date().toISOString()
            };

            const { error: upsertError } = await (supabase.from("achievement_progress") as any).upsert(upsertData, {
                onConflict: 'user_id,achievement_code'
            });

            if (upsertError) {
                console.error("Failed to upsert achievement progress:", upsertError);
                continue;
            }

            // Check if it's now unlocked
            if (currentValue >= condition.target) {
                await checkAndUnlockAchievements(supabase, userId);
            }
        }
    } catch (error) {
        console.error("Error in incrementAchievementProgress:", error);
        throw error;
    }
}
