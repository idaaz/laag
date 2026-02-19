"use client";

import { useState, useMemo } from "react";
import { Trophy, TrendingUp, Lock, Search } from "lucide-react";
import { PageFrame } from "@/components/structure/PageFrame";
import { SectionHeader } from "@/components/structure/SectionHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useAchievements } from "@/hooks/useAchievements";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { CategoryFilter, CATEGORY_CONFIG } from "@/components/achievements/CategoryFilter";
import { ProgressRing } from "@/components/achievements/ProgressRing";

export default function AchievementsPage() {
  const { user } = useAuth();
  const achievementsQuery = useAchievements(user?.id);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const categoryCounts = useMemo(() => {
    if (!achievementsQuery.data) return {};
    return Object.entries(CATEGORY_CONFIG).reduce((acc, [key]) => {
      acc[key] = achievementsQuery.data.byCategory[key as keyof typeof achievementsQuery.data.byCategory]?.length || 0;
      return acc;
    }, {} as Record<string, number>);
  }, [achievementsQuery]);

  const filteredAchievements = useMemo(() => {
    if (!achievementsQuery.data) return { unlocked: [], locked: [] };

    let achievements = achievementsQuery.data.all;

    // Filter by category
    if (selectedCategory) {
      achievements = achievements.filter(a => a.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      achievements = achievements.filter(
        a =>
          a.title.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query)
      );
    }

    return {
      unlocked: achievements.filter(a => a.isUnlocked),
      locked: achievements.filter(a => !a.isUnlocked)
    };
  }, [achievementsQuery.data, selectedCategory, searchQuery]);

  const completionPercentage = achievementsQuery.data
    ? Math.round((achievementsQuery.data.unlockedCount / achievementsQuery.data.totalCount) * 100)
    : 0;

  // Recent unlocks (last 3)
  const recentUnlocks = useMemo(() => {
    if (!achievementsQuery.data) return [];
    return [...achievementsQuery.data.unlocked]
      .sort((a, b) => (b.unlockedAt || "").localeCompare(a.unlockedAt || ""))
      .slice(0, 3);
  }, [achievementsQuery.data]);

  return (
    <PageFrame
      header={
        <SectionHeader
          title="Achievements"
          description={
            achievementsQuery.data
              ? `${achievementsQuery.data.unlockedCount} / ${achievementsQuery.data.totalCount} unlocked`
              : "Unlock achievements to earn rewards"
          }
          icon={<Trophy className="h-5 w-5" />}
        />
      }
    >
      {/* Stats Overview */}
      <section className="col-span-full lg:col-span-4 rounded-xl border border-border/80 bg-card/85 p-4">
        <h2 className="text-sm font-semibold mb-3">Progress Overview</h2>

        {achievementsQuery.isLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <ProgressRing percentage={completionPercentage} size={100} strokeWidth={8} color="var(--k-gold)" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                <span className="text-[var(--k-gold)] font-bold">{achievementsQuery.data?.unlockedCount}</span> of <span className="text-[var(--k-gray)] font-bold">{achievementsQuery.data?.totalCount}</span> achievements
              </p>
              {achievementsQuery.data && achievementsQuery.data.locked.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Next: {achievementsQuery.data.locked[0]?.title}
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Recent Unlocks */}
      <section className="col-span-full lg:col-span-8 rounded-xl border border-border/80 bg-card/85 p-4">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Recent Unlocks
        </h2>

        {achievementsQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : recentUnlocks.length > 0 ? (
          <div className="space-y-2">
            {recentUnlocks.map((achievement) => (
              <div
                key={achievement.code}
                className="flex items-center gap-3 p-2 rounded-lg bg-background/60 border border-border/50"
              >
                <Trophy className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(achievement.unlockedAt!).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs font-medium text-primary shrink-0">
                  +{achievement.xp_reward} XP
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Lock className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No achievements unlocked yet</p>
            <p className="text-xs text-muted-foreground">Complete tasks and habits to start earning!</p>
          </div>
        )}
      </section>

      {/* Filters */}
      <section className="col-span-full rounded-xl border border-border/80 bg-card/85 p-4">
        <div className="flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category filters */}
          {achievementsQuery.data && (
            <CategoryFilter
              selected={selectedCategory}
              onSelect={setSelectedCategory}
              counts={categoryCounts}
            />
          )}
        </div>
      </section>

      {/* Unlocked Achievements */}
      {filteredAchievements.unlocked.length > 0 && (
        <section className="col-span-full">
          <h2 className="text-sm font-semibold mb-3 px-1">
            Unlocked ({filteredAchievements.unlocked.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAchievements.unlocked.map((achievement) => (
              <AchievementCard key={achievement.code} achievement={achievement} />
            ))}
          </div>
        </section>
      )}

      {/* Locked Achievements */}
      {filteredAchievements.locked.length > 0 && (
        <section className="col-span-full">
          <h2 className="text-sm font-semibold mb-3 px-1">
            Locked ({filteredAchievements.locked.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAchievements.locked.map((achievement) => (
              <AchievementCard key={achievement.code} achievement={achievement} />
            ))}
          </div>
        </section>
      )}

      {/* Loading State */}
      {achievementsQuery.isLoading && (
        <section className="col-span-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!achievementsQuery.isLoading && filteredAchievements.unlocked.length === 0 && filteredAchievements.locked.length === 0 && (
        <section className="col-span-full">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No achievements found</p>
            <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
          </div>
        </section>
      )}
    </PageFrame>
  );
}
