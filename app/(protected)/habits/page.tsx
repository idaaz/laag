"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Edit, Flame, Plus, Search, Trash2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { CompactListItem } from "@/components/structure/CompactListItem";
import { Sun, SunDim, Moon, Sunset, Coffee } from "lucide-react";

import { PageFrame } from "@/components/structure/PageFrame";
import { SectionHeader } from "@/components/structure/SectionHeader";
import { HabitCompletionDialog } from "@/components/habits/HabitCompletionDialog";
import { HabitFormDialog, type QuestionDraft } from "@/components/habits/HabitFormDialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { KPIPanel } from "@/components/ui/KPIPanel";
import { useRegisterKPIs } from "@/lib/context/MobileKPIContext";
import { ArchiveViewerDialog } from "@/components/archive/ArchiveViewerDialog";
import { useAuth } from "@/hooks/useAuth";
import { useHabits } from "@/hooks/useHabits";
import { useXP } from "@/hooks/useXP";
import type { HabitQuestionRow, HabitRow } from "@/lib/supabase/types";

import { useRealtime } from "@/hooks/useRealtime";

const PAGE_SIZE = 10;

type HabitFormPayload = {
    name: string;
    questions: QuestionDraft[];
    frequency_per_week: number;
    xp_per_completion: number;
    time_of_day?: "morning" | "afternoon" | "evening" | "night" | "anytime";
    specific_time?: string | null;
};

export default function HabitsPage() {
    const { user, loading } = useAuth();
    const userId = user?.id;
    const searchParams = useSearchParams();
    const router = useRouter();

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    // Subscribe to changes for habits
    useRealtime(["habits"], [["habits", userId ?? ""]]);

    const { habitsQuery, createHabit, updateHabit, deleteHabit, completeHabit, getHabitQuestions } =
        useHabits(userId, page, PAGE_SIZE, search);
    const { awardXP } = useXP(userId);

    const [formOpen, setFormOpen] = useState(false);
    const [completionOpen, setCompletionOpen] = useState(false);
    const [editingHabit, setEditingHabit] = useState<HabitRow | null>(null);
    const [selectedHabit, setSelectedHabit] = useState<HabitRow | null>(null);
    const [habitQuestions, setHabitQuestions] = useState<HabitQuestionRow[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Sync search with URL for in-tab search
    useEffect(() => {
        const q = searchParams.get("q") || "";
        setSearch(q);
    }, [searchParams]);

    // Handle ?action=new
    useEffect(() => {
        if (searchParams.get("action") === "new") {
            setEditingHabit(null);
            setFormOpen(true);
            // Clean up action without removing q
            const params = new URLSearchParams(searchParams.toString());
            params.delete("action");
            const qs = params.toString();
            router.replace(qs ? `/habits?${qs}` : "/habits", { scroll: false });
        }
    }, [searchParams, router]);

    async function handleCreate(data: HabitFormPayload) {
        setError(null);
        if (!userId) {
            setError("Waiting for auth.");
            return;
        }
        try {
            await createHabit.mutateAsync({
                name: data.name,
                questions: data.questions,
                frequency_per_week: data.frequency_per_week,
                xp_per_completion: data.xp_per_completion,
                time_of_day: data.time_of_day,
                specific_time: data.specific_time
            });
            if (page !== 1) setPage(1);
        } catch (createError) {
            setError(createError instanceof Error ? createError.message : "Create failed.");
            throw createError;
        }
    }

    async function handleUpdate(data: HabitFormPayload) {
        setError(null);
        if (!userId || !editingHabit) {
            setError("Waiting for auth.");
            return;
        }
        try {
            await updateHabit.mutateAsync({
                habitId: editingHabit.id,
                name: data.name,
                questions: data.questions,
                frequency_per_week: data.frequency_per_week,
                xp_per_completion: data.xp_per_completion,
                time_of_day: data.time_of_day,
                specific_time: data.specific_time
            });
            setEditingHabit(null);
        } catch (updateError) {
            setError(updateError instanceof Error ? updateError.message : "Update failed.");
            throw updateError;
        }
    }

    async function handleDelete(habitId: string) {
        if (!confirm("Delete this habit?")) return;
        setError(null);
        try {
            await deleteHabit.mutateAsync(habitId);
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : "Delete failed.");
        }
    }

    async function openCompletionDialog(habit: HabitRow) {
        setSelectedHabit(habit);
        try {
            const questions = await getHabitQuestions(habit.id);
            setHabitQuestions(questions);
            setCompletionOpen(true);
        } catch (completionError) {
            setError(completionError instanceof Error ? completionError.message : "Load failed.");
        }
    }

    async function handleCompletion(answers: { questionId: string; value: string }[]) {
        setError(null);
        if (!userId || !selectedHabit) {
            setError("Session not ready.");
            return;
        }
        try {
            await completeHabit.mutateAsync({ habit: selectedHabit, answers });
            await awardXP.mutateAsync({
                sourceType: "habit_complete",
                customHabitXP: selectedHabit.xp_per_completion,
                completed: true,
                sourceId: selectedHabit.id,
                reason: `Habit completed: ${selectedHabit.name}`
            });
            setSelectedHabit(null);
            setHabitQuestions([]);
        } catch (completeError) {
            setError(completeError instanceof Error ? completeError.message : "Log failed.");
        }
    }

    async function openEditDialog(habit: HabitRow) {
        try {
            const questions = await getHabitQuestions(habit.id);
            setHabitQuestions(questions);
            setEditingHabit(habit);
            setFormOpen(true);
        } catch (editError) {
            setError(editError instanceof Error ? editError.message : "Load failed.");
        }
    }

    const habitList = useMemo(() => habitsQuery.data?.data ?? [], [habitsQuery.data]);
    const totalCount = habitsQuery.data?.count ?? 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    // Calculate KPIs
    const kpis = useMemo(() => {
        const total = habitList.length;
        const activeStreaks = habitList.filter(h => h.current_streak > 0).length;
        const avgStreak = total > 0
            ? (habitList.reduce((sum, h) => sum + h.current_streak, 0) / total).toFixed(1)
            : "0";
        const bestStreak = total > 0
            ? Math.max(...habitList.map(h => h.longest_streak))
            : 0;

        return [
            { label: "Total Habits", value: total, color: "info" as const },
            { label: "Active Streaks", value: activeStreaks, color: "achievement" as const },
            { label: "Avg Streak", value: `${avgStreak}d`, color: "score" as const },
            { label: "Best Streak", value: `${bestStreak}d`, color: "achievement" as const }
        ];
    }, [habitList]);

    const mobileKPIs = useMemo(() =>
        kpis.map(k => ({ ...k, color: k.color as "default" | "info" | "success" | "warning" | "danger" | "score" | "achievement" | "focus" | "calibration" }))
        , [kpis]);

    useRegisterKPIs(mobileKPIs);

    const todayStr = format(new Date(), "yyyy-MM-dd");

    // Grouping Logic
    const groupedHabits = useMemo(() => {
        const groups: Record<string, HabitRow[]> = {
            morning: [],
            afternoon: [],
            evening: [],
            night: [],
            anytime: []
        };

        habitList.forEach(habit => {
            const time = habit.time_of_day || "anytime";
            if (groups[time]) {
                groups[time].push(habit);
            } else {
                groups.anytime.push(habit);
            }
        });

        return groups;
    }, [habitList]);

    const getCurrentTimeOfDay = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return "morning";
        if (hour >= 12 && hour < 17) return "afternoon";
        if (hour >= 17 && hour < 21) return "evening";
        return "night";
    };

    const currentTimePeriod = getCurrentTimeOfDay();

    // Reorder sections based on current time
    const sortedSections = useMemo(() => {
        const sections = [
            { id: "morning", label: "Morning (5am - 12pm)", icon: Coffee },
            { id: "afternoon", label: "Afternoon (12pm - 5pm)", icon: Sun },
            { id: "evening", label: "Evening (5pm - 9pm)", icon: Sunset },
            { id: "night", label: "Night (9pm - 5am)", icon: Moon },
            { id: "anytime", label: "Anytime", icon: SunDim }
        ];

        const currentIndex = sections.findIndex(s => s.id === currentTimePeriod);
        if (currentIndex === -1) return sections;

        // Move current time to the top, then anytime, then others sequentially
        const current = sections[currentIndex];
        const anytime = sections.find(s => s.id === "anytime")!;
        const remaining = sections.filter(s => s.id !== currentTimePeriod && s.id !== "anytime");

        return [current, anytime, ...remaining];
    }, [currentTimePeriod]);


    return (
        <>
            <HabitFormDialog
                key={editingHabit ? editingHabit.id : "new-habit"}
                open={formOpen}
                onOpenChange={(open) => {
                    setFormOpen(open);
                    if (!open) {
                        setEditingHabit(null);
                        setHabitQuestions([]);
                    }
                }}
                onSubmit={editingHabit ? handleUpdate : handleCreate}
                initialName={editingHabit?.name}
                initialQuestions={editingHabit ? habitQuestions : undefined}
                initialFrequency={editingHabit?.frequency_per_week}
                initialXP={editingHabit?.xp_per_completion}
                initialTimeOfDay={editingHabit?.time_of_day}
                initialSpecificTime={editingHabit?.specific_time}
            />

            <HabitCompletionDialog
                open={completionOpen}
                onOpenChange={setCompletionOpen}
                questions={habitQuestions}
                onSubmit={handleCompletion}
            />

            <PageFrame
                header={
                    <SectionHeader
                        title="Habits"
                        description="Consistency is the only metric."
                        actions={
                            <div className="flex items-center gap-2">
                                <ArchiveViewerDialog type="habits" />
                                <Button onClick={() => setFormOpen(true)} className="hidden md:flex gap-2">
                                    <Plus className="h-4 w-4" />
                                    New
                                </Button>
                            </div>
                        }
                    />
                }
            >
                <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* KPI Panel - HIDDEN ON MOBILE, use overlay */}
                    <div className="hidden md:block md:order-2">
                        <KPIPanel title="Habits Overview" items={kpis} />
                    </div>

                    {/* Main List */}
                    <div className="md:col-span-2 md:order-1 rounded-xl border border-border/80 bg-card/85 p-4 min-h-[360px] flex flex-col gap-4">
                        <div className="relative hidden md:block">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    if (page !== 1) setPage(1);
                                }}
                                placeholder="Search habits..."
                                className="pl-9"
                            />
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto laag-scroll pr-1">
                            {((loading && !userId) || habitsQuery.isLoading) ? (
                                <div className="space-y-3 py-1">
                                    {[1, 2, 3, 4].map((item) => (
                                        <Skeleton key={item} className="h-[74px] w-full rounded-xl" />
                                    ))}
                                </div>
                            ) : null}
                            {!loading && !userId && !habitsQuery.isLoading ? (
                                <p className="text-center text-muted-foreground py-16">Redirecting...</p>
                            ) : null}
                            {error ? <p className="text-sm text-destructive mb-3 px-2 py-2 rounded-md bg-destructive/10 border border-destructive/20">{error}</p> : null}
                            {userId && habitList.length ? (
                                <div className="space-y-6 pb-2">
                                    {sortedSections.map(section => {
                                        const sectionHabits = groupedHabits[section.id] || [];
                                        if (sectionHabits.length === 0) return null;

                                        return (
                                            <div key={section.id} className="space-y-2">
                                                <div className="flex items-center gap-2 px-1">
                                                    <section.icon className={cn(
                                                        "w-4 h-4",
                                                        section.id === currentTimePeriod ? "text-primary" : "text-muted-foreground"
                                                    )} />
                                                    <h3 className={cn(
                                                        "text-sm font-semibold tracking-tight",
                                                        section.id === currentTimePeriod ? "text-primary" : "text-muted-foreground"
                                                    )}>
                                                        {section.label}
                                                    </h3>
                                                    {section.id === currentTimePeriod && (
                                                        <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider ml-2">Now</span>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    {sectionHabits.map((habit) => {
                                                        const isCompletedToday = habit.last_completed_on === todayStr;

                                                        return (
                                                            <div key={habit.id} className={cn("transition-opacity", isCompletedToday && "opacity-60")}>
                                                                <CompactListItem
                                                                    label={habit.name}
                                                                    meta={
                                                                        <div className="flex items-center gap-2">
                                                                            <span>Streak {habit.current_streak} | Best {habit.longest_streak}</span>
                                                                            {habit.specific_time && (
                                                                                <span className="flex items-center gap-1 text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">
                                                                                    {habit.specific_time}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    }
                                                                    icon={isCompletedToday ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Flame className={cn("h-4 w-4", habit.current_streak > 0 ? "text-amber-500" : "")} />}
                                                                    controls={
                                                                        <>
                                                                            <span
                                                                                role="button"
                                                                                tabIndex={0}
                                                                                onClick={(event) => {
                                                                                    event.stopPropagation();
                                                                                    openEditDialog(habit);
                                                                                }}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === "Enter" || e.key === " ") openEditDialog(habit);
                                                                                }}
                                                                                className="rounded-md border border-border p-1.5 hover:bg-secondary hover:border-border/80 transition-colors cursor-pointer"
                                                                                aria-label="Edit"
                                                                                title="Edit"
                                                                            >
                                                                                <Edit className="h-3.5 w-3.5" />
                                                                            </span>
                                                                            <span
                                                                                role="button"
                                                                                tabIndex={0}
                                                                                onClick={(event) => {
                                                                                    event.stopPropagation();
                                                                                    handleDelete(habit.id);
                                                                                }}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === "Enter" || e.key === " ") handleDelete(habit.id);
                                                                                }}
                                                                                className="rounded-md border border-border p-1.5 hover:bg-secondary hover:border-border/80 transition-colors cursor-pointer"
                                                                                aria-label="Delete"
                                                                                title="Delete"
                                                                            >
                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                            </span>
                                                                            <span
                                                                                role="button"
                                                                                tabIndex={0}
                                                                                onClick={(event) => {
                                                                                    event.stopPropagation();
                                                                                    openCompletionDialog(habit);
                                                                                }}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === "Enter" || e.key === " ") openCompletionDialog(habit);
                                                                                }}
                                                                                className={cn(buttonVariants({ size: "sm" }), "cursor-pointer", isCompletedToday && "bg-success text-success-foreground hover:bg-success/90")}
                                                                                aria-disabled={loading || !userId || completeHabit.isPending || awardXP.isPending}
                                                                            >
                                                                                {completeHabit.isPending || awardXP.isPending ? "..." : (isCompletedToday ? "Logged" : "Log")}
                                                                            </span>
                                                                        </>
                                                                    }
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : null}
                            {userId && !habitsQuery.isLoading && !habitList.length ? (
                                <div className="py-12">
                                    <EmptyState
                                        title="No habits yet"
                                        description="Create a habit to start building consistency."
                                        action={<Button onClick={() => { setEditingHabit(null); setFormOpen(true); }}><Plus className="h-4 w-4 mr-2" />Create Habit</Button>}
                                    />
                                </div>
                            ) : null}
                        </div>

                        <PaginationControls
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            isLoading={habitsQuery.isFetching}
                            itemCount={habitList.length}
                        />
                    </div>
                </div>
            </PageFrame>

        </>
    );
}
