import { useEffect } from "react";
import { pushToast } from "@/components/ui/toast";
import type { AchievementRow } from "@/lib/supabase/types";

const TIER_EMOJI = {
    bronze: "🥉",
    silver: "🥈",
    gold: "🥇",
    platinum: "💎"
};

export function showAchievementUnlock(achievement: AchievementRow & { tier?: string; xp_reward?: number }) {
    const emoji = achievement.tier ? TIER_EMOJI[achievement.tier as keyof typeof TIER_EMOJI] || "🏆" : "🏆";
    pushToast(
        `Achievement Unlocked! ${emoji}`,
        `${achievement.title}: ${achievement.description}${achievement.xp_reward ? ` (+${achievement.xp_reward} XP)` : ""}`
    );
}

export function useAchievementNotifications() {
    useEffect(() => {
        // Listen for achievement unlocks (can be extended to use a real-time subscription)
        const handleAchievementUnlock = (event: CustomEvent) => {
            showAchievementUnlock(event.detail);
        };

        window.addEventListener("achievement-unlocked" as string, handleAchievementUnlock as EventListener);

        return () => {
            window.removeEventListener("achievement-unlocked" as string, handleAchievementUnlock as EventListener);
        };
    }, []);
}
