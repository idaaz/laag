"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { checkAndUnlockAchievements } from "@/lib/engines/achievementEngine";
import type {
    AchievementDefinitionRow,
    AchievementRow,
    AchievementProgressRow,
    AchievementCategory
} from "@/lib/supabase/types";

const ACHIEVEMENTS_QUERY_KEY = ["achievements"];

export interface AchievementWithProgress extends AchievementDefinitionRow {
    isUnlocked: boolean;
    unlockedAt?: string;
    progress?: {
        current: number;
        target: number;
        percentage: number;
    };
}

export function useAchievements(userId?: string) {
    const supabase = getSupabaseBrowserClient();

    const achievementsQuery = useQuery({
        queryKey: [...ACHIEVEMENTS_QUERY_KEY, userId],
        enabled: !!userId,
        queryFn: async () => {
            if (!userId) throw new Error("Missing user");

            const [definitions, unlockedData, progress] = await Promise.all([
                supabase.from("achievement_definitions").select("*").order("display_order"),
                supabase.from("achievements").select("*").eq("user_id", userId),
                supabase.from("achievement_progress").select("*").eq("user_id", userId)
            ]);

            if (definitions.error) throw definitions.error;
            if (unlockedData.error) throw unlockedData.error;
            if (progress.error) throw progress.error;

            const unlockedMap = new Map<string, AchievementRow>();
            (unlockedData.data ?? []).forEach((a: AchievementRow) => {
                unlockedMap.set(a.code, a);
            });

            const progressMap = new Map<string, AchievementProgressRow>();
            (progress.data ?? []).forEach((p: AchievementProgressRow) => {
                progressMap.set(p.achievement_code, p);
            });

            const achievementsWithProgress: AchievementWithProgress[] = (
                definitions.data ?? []
            ).map((def: AchievementDefinitionRow) => {
                const unlockedAchievement = unlockedMap.get(def.code);
                const progressData = progressMap.get(def.code);

                return {
                    ...def,
                    isUnlocked: !!unlockedAchievement,
                    unlockedAt: unlockedAchievement?.unlocked_at,
                    progress: progressData
                        ? {
                            current: progressData.current_value,
                            target: progressData.target_value,
                            percentage: Math.round(
                                (progressData.current_value / progressData.target_value) * 100
                            )
                        }
                        : undefined
                };
            });

            // Categorize
            const byCategory = achievementsWithProgress.reduce(
                (acc, achievement) => {
                    if (!acc[achievement.category]) {
                        acc[achievement.category] = [];
                    }
                    acc[achievement.category].push(achievement);
                    return acc;
                },
                {} as Record<AchievementCategory, AchievementWithProgress[]>
            );

            const unlocked = achievementsWithProgress.filter((a) => a.isUnlocked);
            const locked = achievementsWithProgress.filter((a) => !a.isUnlocked);

            return {
                all: achievementsWithProgress,
                unlocked,
                locked,
                byCategory,
                totalCount: definitions.data?.length ?? 0,
                unlockedCount: unlocked.length
            };
        }
    });

    return achievementsQuery;
}

export function useCheckAchievements() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            return await checkAndUnlockAchievements(userId);
        },
        onSuccess: (_newAchievements, userId) => {
            queryClient.invalidateQueries({ queryKey: [...ACHIEVEMENTS_QUERY_KEY, userId] });
            queryClient.invalidateQueries({ queryKey: ["xp_events"] });
        }
    });
}
