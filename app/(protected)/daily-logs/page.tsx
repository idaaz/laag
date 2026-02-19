"use client";
import { cn } from "@/lib/utils";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, Flame, Target } from "lucide-react";
import { PageFrame } from "@/components/structure/PageFrame";
import { SectionHeader } from "@/components/structure/SectionHeader";
import { LogTimeline } from "@/components/dashboard/LogTimeline";
import { TimeBlockLogger } from "@/components/dashboard/TimeBlockLogger";
import { Skeleton } from "@/components/ui/skeleton";
import { pushToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { TimeBlockRow } from "@/lib/supabase/types";

import { useRealtime } from "@/hooks/useRealtime";

function SmallMetric({
  label,
  value,
  icon,
  tone = "default"
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "default" | "success" | "danger" | "warning" | "info" | "focus" | "score" | "achievement" | "calibration";
}) {
  const Icon = icon;
  return (
    <article className="rounded-xl border border-border/80 bg-card/85 p-3" role="status" aria-label={`${label}: ${value}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className={cn(
          "h-4 w-4",
          tone === "success" && "text-[var(--k-green)]",
          tone === "danger" && "text-[var(--k-red)]",
          tone === "warning" && "text-[var(--k-orange)]",
          tone === "info" && "text-[var(--k-blue)]",
          tone === "focus" && "text-[var(--k-teal)]",
          tone === "score" && "text-[var(--k-indigo)]",
          tone === "achievement" && "text-[var(--k-gold)]",
          tone === "calibration" && "text-[var(--k-purple)]",
          tone === "default" && "text-primary"
        )} />
      </div>
      <p className={cn(
        "text-2xl font-semibold mt-1",
        tone === "success" && "text-[var(--k-green)]",
        tone === "danger" && "text-[var(--k-red)]",
        tone === "warning" && "text-[var(--k-orange)]",
        tone === "info" && "text-[var(--k-blue)]",
        tone === "focus" && "text-[var(--k-teal)]",
        tone === "score" && "text-[var(--k-indigo)]",
        tone === "achievement" && "text-[var(--k-gold)]",
        tone === "calibration" && "text-[var(--k-purple)]"
      )}>{value}</p>
    </article>
  );
}

export default function DailyLogsPage() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;
  const searchParams = useSearchParams();
  const router = useRouter();

  const today = new Date().toISOString().slice(0, 10);
  const [activeStartTime, setActiveStartTime] = useState<string | null>(null);

  // Handle ?action=new
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      // Just clean up, the logger is already central on this page
      router.replace("/daily-logs", { scroll: false });
    }
  }, [searchParams, router]);

  // Subscribe to changes for time blocks
  useRealtime(["time_blocks"], [["time-blocks", userId ?? "", today]]);

  const blocksQuery = useQuery<TimeBlockRow[]>({
    queryKey: ["time-blocks", userId, today],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) throw new Error("Missing user");
      const { data, error } = await supabase
        .from("time_blocks")
        .select("*")
        .eq("user_id", userId)
        .gte("start_time", `${today}T00:00:00Z`)
        .lte("start_time", `${today}T23:59:59Z`)
        .order("start_time", { ascending: false })
        .limit(100);
      if (error) throw new Error(error.message);
      return (data ?? []) as TimeBlockRow[];
    }
  });

  const saveBlock = useMutation({
    mutationFn: async (data: {
      activity: string;
      category: string;
      is_planned: boolean;
      energy_level: number;
      output_notes: string;
    }) => {
      if (!userId) throw new Error("Missing user");

      const now = new Date();
      let start: Date;

      if (activeStartTime) {
        const [hour, minute] = activeStartTime.split(":").map(Number);
        start = new Date();
        start.setHours(hour, minute, 0, 0);
      } else {
        start = new Date();
        start.setMinutes(now.getMinutes() < 30 ? 0 : 30, 0, 0);
      }

      const end = new Date(start.getTime() + 30 * 60000);

      const { error } = await supabase
        .from("time_blocks")
        .insert({
          user_id: userId,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          activity: data.activity,
          category: data.category,
          is_planned: data.is_planned,
          energy_level: data.energy_level,
          output_notes: data.output_notes || null
        } as never);

      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["time-blocks"] });
      setActiveStartTime(null);
      pushToast("Success", "Time block saved.");

      // Trigger achievement check
      if (userId) {
        const { checkAndUnlockAchievements } = await import("@/lib/engines/achievementEngine");
        checkAndUnlockAchievements(userId).catch(console.error);
      }
    },
    onError: (error) => {
      console.error("Failed to save time block:", error);
      pushToast("Error", error instanceof Error ? error.message : "Failed to save block");
    }
  });

  const stats = useMemo(() => {
    const blocks = blocksQuery.data ?? [];
    if (blocks.length === 0) return { focusScore: 0, deepWorkHours: 0, avgEnergy: 0 };

    const intentionalBlocks = blocks.filter((block) => block.is_planned).length;
    const focusScore = Math.round((intentionalBlocks / blocks.length) * 100);
    const deepWorkMinutes = blocks.filter((block) => block.category === "Deep Work").length * 30;
    const deepWorkHours = Number((deepWorkMinutes / 60).toFixed(1));
    const avgEnergy = Number(
      (blocks.reduce((sum, block) => sum + block.energy_level, 0) / blocks.length).toFixed(1)
    );

    return { focusScore, deepWorkHours, avgEnergy };
  }, [blocksQuery.data]);
  const loadingBlocks = blocksQuery.isLoading && !blocksQuery.data;

  return (
    <PageFrame
      header={
        <SectionHeader
          title="Logs"
          description="Track each block."
        />
      }
    >
      {loadingBlocks ? (
        <>
          <div className="col-span-full md:col-span-2 lg:col-span-4">
            <Skeleton className="h-[86px] w-full rounded-xl" />
          </div>
          <div className="col-span-full md:col-span-2 lg:col-span-4">
            <Skeleton className="h-[86px] w-full rounded-xl" />
          </div>
          <div className="col-span-full md:col-span-2 lg:col-span-4">
            <Skeleton className="h-[86px] w-full rounded-xl" />
          </div>
        </>
      ) : (
        <>
          <div className="col-span-full md:col-span-2 lg:col-span-4">
            <SmallMetric label="Focus" value={`${stats.focusScore}%`} icon={Target} tone="score" />
          </div>
          <div className="col-span-full md:col-span-2 lg:col-span-4">
            <SmallMetric label="Deep" value={`${stats.deepWorkHours}h`} icon={Brain} tone="focus" />
          </div>
          <div className="col-span-full md:col-span-2 lg:col-span-4">
            <SmallMetric label="Energy" value={`${stats.avgEnergy}`} icon={Flame} tone="achievement" />
          </div>
        </>
      )}

      <div className="col-span-full lg:col-span-8">
        {loadingBlocks ? (
          <Skeleton className="h-[420px] w-full rounded-xl" />
        ) : null}
        {!loadingBlocks && activeStartTime ? (
          <p className="mb-2 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs text-primary">
            Fill {activeStartTime}
          </p>
        ) : null}
        {!loadingBlocks ? (
          <TimeBlockLogger
            onSave={(data) => saveBlock.mutateAsync(data)}
            isLoading={saveBlock.isPending}
          />
        ) : null}
      </div>
      <div className="col-span-full md:hidden rounded-xl border border-border/80 bg-card/85 p-3">
        <h2 className="mb-2 text-sm font-semibold">Recent Blocks</h2>
        {loadingBlocks ? (
          <div className="space-y-2">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-[52px] w-full rounded-xl" />
            ))}
          </div>
        ) : (blocksQuery.data ?? []).length ? (
          <div className="space-y-2">
            {(blocksQuery.data ?? []).slice(0, 5).map((block) => (
              <article key={block.id} className="rounded-lg border border-border/70 bg-background/55 p-2">
                <p className="text-sm font-medium">{block.activity}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(block.start_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                  {" - "}
                  {block.category}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No blocks yet today.</p>
        )}
        <p className="sr-only">
          Desktop timeline remains mounted for larger screens.
        </p>
      </div>
      <div className="hidden col-span-full rounded-xl border border-border/80 bg-card/85 p-3 md:block lg:col-span-4">
        <h2 className="text-sm font-semibold mb-2">Timeline</h2>
        <div className="max-h-[640px] overflow-y-auto laag-scroll pr-1">
          {loadingBlocks ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Skeleton key={item} className="h-[56px] w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <LogTimeline
              blocks={blocksQuery.data ?? []}
              onFillGhost={(startTime) => {
                setActiveStartTime(startTime);
                document.querySelector(".overflow-y-auto")?.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
        </div>
      </div>
    </PageFrame>
  );
}
