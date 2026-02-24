"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    const achievementsQuery = useQuery({
        queryKey: [...ACHIEVEMENTS_QUERY_KEY, userId],
        enabled: !!userId,
        queryFn: async () => {
            if (!userId) throw new Error("Missing user");

            const res = await fetch(`/api/achievements?userId=${encodeURIComponent(userId)}`);
            if (!res.ok) throw new Error("Failed to fetch achievements");

            const data = await res.json();
            const { definitions, unlocked, progress } = data;

            const unlockedMap = new Map<string, AchievementRow>();
            (unlocked ?? []).forEach((a: AchievementRow) => {
                unlockedMap.set(a.code, a);
            });

            const progressMap = new Map<string, AchievementProgressRow>();
            (progress ?? []).forEach((p: AchievementProgressRow) => {
                progressMap.set(p.achievement_code, p);
            });

            const achievementsWithProgress: AchievementWithProgress[] = (
                definitions ?? []
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

            const unlockedItems = achievementsWithProgress.filter((a) => a.isUnlocked);
            const lockedItems = achievementsWithProgress.filter((a) => !a.isUnlocked);

            return {
                all: achievementsWithProgress,
                unlocked: unlockedItems,
                locked: lockedItems,
                byCategory,
                totalCount: definitions?.length ?? 0,
                unlockedCount: unlockedItems.length
            };
        }
    });

    return achievementsQuery;
}

export function useCheckAchievements() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            const res = await fetch("/api/achievements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId })
            });
            if (!res.ok) throw new Error("Failed to check achievements");
            return await res.json();
        },
        onSuccess: (_data, userId) => {
            queryClient.invalidateQueries({ queryKey: [...ACHIEVEMENTS_QUERY_KEY, userId] });
            queryClient.invalidateQueries({ queryKey: ["xp_events"] });
        }
    });
}
