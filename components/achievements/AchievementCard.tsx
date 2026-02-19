import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import type { AchievementWithProgress } from "@/hooks/useAchievements";

interface AchievementCardProps {
    achievement: AchievementWithProgress;
    className?: string;
}

const TIER_COLORS = {
    bronze: "text-amber-700 dark:text-amber-600",
    silver: "text-gray-500 dark:text-gray-400",
    gold: "text-yellow-500 dark:text-yellow-400",
    platinum: "text-purple-500 dark:text-purple-400"
};

const TIER_BG = {
    bronze: "bg-amber-100 dark:bg-amber-950/30",
    silver: "bg-gray-100 dark:bg-gray-900/30",
    gold: "bg-yellow-100 dark:bg-yellow-950/30",
    platinum: "bg-purple-100 dark:bg-purple-950/30"
};

const TIER_BORDER = {
    bronze: "border-amber-300 dark:border-amber-800",
    silver: "border-gray-300 dark:border-gray-700",
    gold: "border-yellow-300 dark:border-yellow-800",
    platinum: "border-purple-300 dark:border-purple-800"
};

const TIER_EMOJI = {
    bronze: "🥉",
    silver: "🥈",
    gold: "🥇",
    platinum: "💎"
};

export function AchievementCard({ achievement, className }: AchievementCardProps) {
    const Icon = (LucideIcons[achievement.icon_name as keyof typeof LucideIcons] ??
        LucideIcons.Trophy) as LucideIcons.LucideIcon;

    const progressPercentage = achievement.progress?.percentage ?? 0;

    return (
        <article
            className={cn(
                "group relative rounded-xl border p-4 transition-all hover:shadow-md",
                achievement.isUnlocked
                    ? cn(
                        "bg-background/60",
                        TIER_BORDER[achievement.tier],
                        "shadow-sm"
                    )
                    : "border-border/60 bg-card/40 opacity-75 hover:opacity-100",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                    className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
                        achievement.isUnlocked
                            ? TIER_BG[achievement.tier]
                            : "bg-muted/50"
                    )}
                >
                    {achievement.isUnlocked ? (
                        <Icon
                            className={cn(
                                "h-6 w-6",
                                TIER_COLORS[achievement.tier]
                            )}
                        />
                    ) : (
                        <LucideIcons.Lock className="h-5 w-5 text-muted-foreground/50" />
                    )}
                </div>

                {/* Title and Description */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">
                            {achievement.title}
                        </h3>
                        <span className="text-lg shrink-0">{TIER_EMOJI[achievement.tier]}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {achievement.description}
                    </p>
                </div>
            </div>

            {/* Progress Bar (for locked achievements) */}
            {!achievement.isUnlocked && achievement.progress && (
                <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                        <span>
                            {achievement.progress.current} / {achievement.progress.target}
                        </span>
                        <span>{progressPercentage}%</span>
                    </div>
                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between text-xs">
                {achievement.isUnlocked ? (
                    <>
                        <span className="text-muted-foreground">
                            Unlocked {new Date(achievement.unlockedAt!).toLocaleDateString()}
                        </span>
                        <span className="font-medium text-primary">
                            +{achievement.xp_reward} XP
                        </span>
                    </>
                ) : (
                    <>
                        <span className="text-muted-foreground capitalize">
                            {achievement.category}
                        </span>
                        <span className="text-muted-foreground">
                            Reward: +{achievement.xp_reward} XP
                        </span>
                    </>
                )}
            </div>

            {/* Hidden badge */}
            {achievement.is_hidden && !achievement.isUnlocked && (
                <div className="absolute top-2 right-2">
                    <div className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-full">
                        Hidden
                    </div>
                </div>
            )}
        </article>
    );
}
