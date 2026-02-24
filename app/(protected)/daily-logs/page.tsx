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
import { useRegisterKPIs } from "@/lib/context/MobileKPIContext";


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
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
    const [activeStartTime, setActiveStartTime] = useState<string | null>(null);
    const [editingBlock, setEditingBlock] = useState<TimeBlockRow | null>(null);

    // Sync search with URL for in-tab search
    useEffect(() => {
        const q = searchParams.get("q") || "";
        setSearchQuery(q);
    }, [searchParams]);

    // Handle ?action=new
    useEffect(() => {
        if (searchParams.get("action") === "new") {
            // Just clean up, the logger is already central on this page
            const params = new URLSearchParams(searchParams.toString());
            params.delete("action");
            const qs = params.toString();
            router.replace(qs ? `/daily-logs?${qs}` : "/daily-logs", { scroll: false });
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

            if (editingBlock) {
                const { error } = await supabase
                    .from("time_blocks")
                    .update({
                        activity: data.activity,
                        category: data.category,
                        is_planned: data.is_planned,
                        energy_level: data.energy_level,
                        output_notes: data.output_notes || null
                    } as never)
                    .eq("id", editingBlock.id);
                if (error) throw new Error(error.message);
                return;
            }

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
            setEditingBlock(null);
            pushToast("Success", editingBlock ? "Time block updated." : "Time block saved.");

            // Trigger achievement check
        },
        onError: (error) => {
            console.error("Failed to save time block:", error);
            pushToast("Error", error instanceof Error ? error.message : "Failed to save block");
        }
    });

    // Trigger achievement check and increment views
    useEffect(() => {
        if (user?.id) {
            // Securely increment analytics_views and check achievements via API
            fetch("/api/achievements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    action: "increment",
                    metric: "analytics_views"
                })
            }).catch(console.error);

            fetch("/api/achievements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id })
            }).catch(console.error);
        }
    }, [user?.id]);

    const handleEditBlock = (block: TimeBlockRow) => {
        setEditingBlock(block);
        setActiveStartTime(null);
        // Scroll to top to see the logger
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCancelEdit = () => {
        setEditingBlock(null);
    };

    const filteredBlocks = useMemo(() => {
        const blocks = blocksQuery.data || [];
        if (!searchQuery) return blocks;
        return blocks.filter(b =>
            (b.activity || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.output_notes || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.category || "").toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [blocksQuery.data, searchQuery]);

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

    const mobileKPIs = useMemo(() => [
        { label: "Focus", value: `${stats.focusScore}%`, color: "score" as const },
        { label: "Deep Work", value: `${stats.deepWorkHours}h`, color: "focus" as const },
        { label: "Energy", value: `${stats.avgEnergy}`, color: "achievement" as const }
    ], [stats]);

    useRegisterKPIs(mobileKPIs);
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
                <div className="hidden lg:contents">
                    <div className="col-span-full md:col-span-2 lg:col-span-4">
                        <Skeleton className="h-[86px] w-full rounded-xl" />
                    </div>
                    <div className="col-span-full md:col-span-2 lg:col-span-4">
                        <Skeleton className="h-[86px] w-full rounded-xl" />
                    </div>
                    <div className="col-span-full md:col-span-2 lg:col-span-4">
                        <Skeleton className="h-[86px] w-full rounded-xl" />
                    </div>
                </div>
            ) : (
                <div className="hidden lg:contents">
                    <div className="col-span-full md:col-span-2 lg:col-span-4">
                        <SmallMetric label="Focus" value={`${stats.focusScore}%`} icon={Target} tone="score" />
                    </div>
                    <div className="col-span-full md:col-span-2 lg:col-span-4">
                        <SmallMetric label="Deep" value={`${stats.deepWorkHours}h`} icon={Brain} tone="focus" />
                    </div>
                    <div className="col-span-full md:col-span-2 lg:col-span-4">
                        <SmallMetric label="Energy" value={`${stats.avgEnergy}`} icon={Flame} tone="achievement" />
                    </div>
                </div>
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
                        initialData={editingBlock}
                        onCancel={editingBlock ? handleCancelEdit : undefined}
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
                ) : filteredBlocks.length ? (
                    <div className="space-y-2">
                        {filteredBlocks.slice(0, 5).map((block) => (
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
                            blocks={filteredBlocks}
                            onFillGhost={(startTime) => {
                                setEditingBlock(null);
                                setActiveStartTime(startTime);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            onEditBlock={handleEditBlock}
                        />
                    )}
                </div>
            </div>
        </PageFrame>
    );
}
