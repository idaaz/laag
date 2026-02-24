"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { format, isPast } from "date-fns";
import { Plus, NotebookPen } from "lucide-react";

import { PageFrame } from "@/components/structure/PageFrame";
import { SectionHeader } from "@/components/structure/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";
import { TaskTable } from "@/components/tasks/TaskTable";
import { KPIPanel } from "@/components/ui/KPIPanel";
import { ArchiveViewerDialog } from "@/components/archive/ArchiveViewerDialog";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";

import { useRealtime } from "@/hooks/useRealtime";
import { useRegisterKPIs } from "@/lib/context/MobileKPIContext";

const PAGE_SIZE = 10;

export default function TasksPage() {
    const { user } = useAuth();
    const userId = user?.id;
    const searchParams = useSearchParams();
    const router = useRouter();

    const [page, setPage] = useState(1);
    const [openDialog, setOpenDialog] = useState(false);
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState<"all" | "todo" | "in_progress" | "completed">("all");

    // Subscribe to changes for tasks
    useRealtime(["tasks", "xp_events"], [["tasks", userId ?? ""], ["xp-summary", userId ?? ""]]);

    // Fetch paginated tasks
    const { tasksQuery, createTask, deleteTask, completeTask } = useTasks(userId, page, PAGE_SIZE);

    // Sync query with URL for in-tab search
    useEffect(() => {
        const q = searchParams.get("q") || "";
        setQuery(q);
    }, [searchParams]);

    // Handle ?action=new
    useEffect(() => {
        if (searchParams.get("action") === "new") {
            setOpenDialog(true);
            // Clean up action without removing q
            const params = new URLSearchParams(searchParams.toString());
            params.delete("action");
            const qs = params.toString();
            router.replace(qs ? `/tasks?${qs}` : "/tasks", { scroll: false });
        }
    }, [searchParams, router]);

    // Client-side filtering on the current page data (Note: for full search, we'd need server-side search)
    const filteredTasks = useMemo(() => {
        const items = tasksQuery.data?.data ?? [];
        return items.filter((task) => {
            const matchesQuery = `${task.title} ${task.description ?? ""}`
                .toLowerCase()
                .includes(query.toLowerCase());
            const matchesStatus = status === "all" ? true : task.status === status;
            return matchesQuery && matchesStatus;
        });
    }, [tasksQuery.data, query, status]);

    const showLoading = tasksQuery.isLoading && !tasksQuery.data;
    const totalCount = tasksQuery.data?.count ?? 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    // Calculate KPIs
    const kpis = useMemo(() => {
        const allTasks = tasksQuery.data?.data ?? [];
        const total = allTasks.length;
        const completed = allTasks.filter(t => t.status === "completed").length;
        const pending = allTasks.filter(t => t.status === "todo" || t.status === "in_progress").length;
        const overdue = allTasks.filter(
            t => t.deadline_at && isPast(new Date(t.deadline_at)) && t.status !== "completed"
        ).length;
        const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return [
            { label: "Total Tasks", value: total, color: "info" as const },
            { label: "Pending", value: pending, color: pending > 0 ? "warning" as const : "default" as const },
            { label: "Completed", value: completed, color: completed > 0 ? "success" as const : "default" as const },
            { label: "Overdue", value: overdue, color: overdue > 0 ? "danger" as const : "default" as const },
            { label: "Success Rate", value: `${successRate}%`, color: "score" as const }
        ];
    }, [tasksQuery.data]);

    const mobileKPIs = useMemo(() =>
        kpis.map(k => ({ ...k, color: k.color as "default" | "info" | "success" | "warning" | "danger" | "score" | "achievement" | "focus" | "calibration" }))
        , [kpis]);

    useRegisterKPIs(mobileKPIs);

    return (
        <>
            <TaskFormDialog
                open={openDialog}
                onOpenChange={setOpenDialog}
                onSubmit={async (draft) => {
                    await createTask(draft);
                    // If created, typically we might want to go to page 1 to see it
                    if (page !== 1) setPage(1);
                }}
            />
            <PageFrame
                header={
                    <SectionHeader
                        title="Tasks"
                        description="Plan. Execute."
                        actions={
                            <div className="flex items-center gap-2">
                                <ArchiveViewerDialog type="tasks" />
                                <Button onClick={() => setOpenDialog(true)} className="hidden md:flex gap-2">
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
                    <div className="hidden md:block md:order-2 sticky top-0 z-10 self-start">
                        <KPIPanel title="Tasks Overview" items={kpis} />
                    </div>

                    {/* Main List */}
                    <div className="md:col-span-2 md:order-1 rounded-xl border border-border/80 bg-card/85 p-3 h-full min-h-[360px] flex flex-col gap-3">
                        <TaskFilters
                            query={query}
                            onQueryChange={setQuery}
                            status={status}
                            onStatusChange={setStatus}
                        />
                        <div className="flex-1 min-h-0 overflow-y-auto laag-scroll">
                            {showLoading ? (
                                <div className="space-y-2 pb-4">
                                    {[1, 2, 3, 4, 5].map((item) => (
                                        <Skeleton key={item} className="h-[86px] w-full rounded-xl" />
                                    ))}
                                </div>
                            ) : filteredTasks.length ? (
                                <div className="pb-4">
                                    <div className="space-y-2 md:hidden">
                                        {filteredTasks.map((task) => (
                                            <article
                                                key={task.id}
                                                className="rounded-xl border border-border/70 bg-background/55 p-3 hover:border-border transition-colors"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <Link
                                                        href={`/tasks/${task.id}`}
                                                        prefetch
                                                        scroll={false}
                                                        className="min-w-0 flex-1 text-sm font-semibold hover:text-primary transition-colors"
                                                    >
                                                        <span className="block truncate">{task.title}</span>
                                                    </Link>
                                                    <Badge variant={task.priority === "critical" ? "destructive" : "secondary"}>
                                                        {task.priority}
                                                    </Badge>
                                                </div>
                                                {task.description ? (
                                                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
                                                ) : null}
                                                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                                    <span className="capitalize">{task.status.replace("_", " ")}</span>
                                                    <span>
                                                        {task.deadline_at
                                                            ? format(new Date(task.deadline_at), "MMM d, HH:mm")
                                                            : "No deadline"}
                                                    </span>
                                                </div>
                                                <div className="mt-3 flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={task.status === "completed"}
                                                        onClick={() => completeTask(task)}
                                                        className="flex-1"
                                                    >
                                                        Complete
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="flex-1" onClick={() => router.push(`/notes?action=new&title=${encodeURIComponent(`Context: ${task.title}`)}`)}>
                                                        <NotebookPen className="h-3.5 w-3.5 mr-1" />
                                                        Note
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => deleteTask(task.id)}>
                                                        Delete
                                                    </Button>
                                                </div>
                                            </article>
                                        ))}
                                        <p className="sr-only">
                                            Desktop task table remains available on larger screens.
                                        </p>
                                    </div>

                                    <div className="hidden md:block">
                                        <TaskTable
                                            tasks={filteredTasks}
                                            onComplete={async (task) => {
                                                await completeTask(task);
                                            }}
                                            onDelete={async (taskId) => {
                                                await deleteTask(taskId);
                                            }}
                                            onAddNote={(task) => {
                                                router.push(`/notes?action=new&title=${encodeURIComponent(`Context: ${task.title}`)}`);
                                            }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12">
                                    <EmptyState
                                        title="No tasks found"
                                        description={query || status !== "all" ? "Try adjusting your filters." : "Create your first task to get started."}
                                        action={!(query || status !== "all") ? <Button onClick={() => setOpenDialog(true)}><Plus className="h-4 w-4 mr-2" />Create Task</Button> : undefined}
                                    />
                                </div>
                            )}
                        </div>

                        <PaginationControls
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            isLoading={tasksQuery.isFetching}
                            itemCount={filteredTasks.length}
                        />
                    </div>
                </div>
            </PageFrame>
        </>
    );
}
