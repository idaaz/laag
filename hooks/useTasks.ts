"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";
import { useXP } from "@/hooks/useXP";
import { pushToast } from "@/components/ui/toast";
import { persistReminder } from "@/lib/notifications/scheduler";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { TaskPriority, TaskRow } from "@/lib/supabase/types";

const TASKS_QUERY_KEY = "tasks";

export type TaskDraft = {
  title: string;
  description: string;
  priority: TaskPriority;
  deadline_at: string | null;
};

type CreateTaskInput = TaskDraft & { clientId: string };

type CompleteTaskInput = {
  task: TaskRow;
  overrideReason: string | null;
};

export function useTasks(userId?: string, page = 1, limit = 10) {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();
  const { awardXP } = useXP(userId);

  // Base key for invalidation
  const baseKey = [TASKS_QUERY_KEY, userId];
  // Specific key for this page
  const queryKey = [...baseKey, { page, limit }] as const;

  const tasksQuery = useQuery({
    queryKey,
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) throw new Error("Missing user");
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from("tasks")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return {
        data: (data ?? []) as TaskRow[],
        count: count ?? 0
      };
    }
  });

  const createTaskMutation = useOptimisticMutation<{ data: TaskRow[]; count: number }, CreateTaskInput, TaskRow>({
    queryKey,
    mutationFn: async (payload) => {
      if (!userId) throw new Error("Missing user");
      const { clientId: _clientId, ...draft } = payload;
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
          title: draft.title,
          description: draft.description || null,
          priority: draft.priority,
          status: "todo",
          deadline_at: draft.deadline_at,
          xp_base: 10,
          xp_bonus: draft.priority === "high" || draft.priority === "critical" ? 20 : 0
        } as never)
        .select("*")
        .single();
      if (error) throw error;

      if (draft.deadline_at) {
        const scheduledFor = new Date(
          new Date(draft.deadline_at).getTime() - 4 * 60 * 60 * 1000
        ).toISOString();
        try {
          await persistReminder({
            userId,
            type: "task_deadline",
            title: "Deadline approaching",
            body: draft.title,
            scheduledFor,
            relatedEntityType: "task",
            context: {
              disciplineScore: 60,
              relapseRisk: 30,
              repeatedMisses: 0,
              unresolvedCriticalTasks: draft.priority === "critical" ? 1 : 0
            }
          });
        } catch {
          // Reminder scheduling should never block task create.
        }
      }

      return data as TaskRow;
    },
    // Optimistic update only if on page 1
    optimisticUpdate: (current, payload) => {
      if (page !== 1) return current ?? { data: [], count: 0 }; // Don't show new task on other pages
      const now = new Date().toISOString();
      const optimistic: TaskRow = {
        id: payload.clientId,
        user_id: userId ?? "",
        title: payload.title,
        description: payload.description || null,
        priority: payload.priority,
        status: "todo",
        deadline_at: payload.deadline_at,
        completed_at: null,
        xp_base: 10,
        xp_bonus: payload.priority === "high" || payload.priority === "critical" ? 20 : 0,
        xp_awarded: 0,
        is_flagged: false,
        override_reason: null,
        created_at: now,
        updated_at: now
      };
      return {
        data: [optimistic, ...(current?.data ?? [])],
        count: (current?.count ?? 0) + 1
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: baseKey });
      pushToast("Task Created", `"${data.title}" has been added to your list.`);
    }
  });

  const deleteTaskMutation = useOptimisticMutation<{ data: TaskRow[]; count: number }, string, void>({
    queryKey,
    mutationFn: async (taskId) => {
      // Archive to GitHub before deleting
      const { data: taskToArchive } = await supabase.from("tasks").select("*").eq("id", taskId).single();
      if (taskToArchive) {
        try {
          await fetch("/api/archive", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "tasks",
              subfolder: "deleted",
              filename: `task_${taskId}_${Date.now()}`,
              payload: taskToArchive
            })
          });
        } catch (e) {
          console.error("Failed to archive task before deletion", e);
        }
      }

      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
    },
    optimisticUpdate: (current, taskId) => ({
      data: (current?.data ?? []).filter((task) => task.id !== taskId),
      count: Math.max(0, (current?.count ?? 0) - 1)
    }),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: baseKey });
      pushToast("Task Deleted", "The task has been archived and removed.");
    }
  });

  const completeTaskMutation = useOptimisticMutation<{ data: TaskRow[]; count: number }, CompleteTaskInput, TaskRow>({
    queryKey,
    mutationFn: async ({ task, overrideReason }) => {
      if (!userId) throw new Error("Missing user");
      const xpResult = await awardXP.mutateAsync({
        sourceType: "task_complete",
        completed: true,
        priority: task.priority,
        sourceId: task.id,
        reason: `Completed task: ${task.title}`
      });

      const { data, error } = await supabase
        .from("tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          xp_awarded: xpResult.finalXP,
          override_reason: overrideReason,
          is_flagged: !!overrideReason
        } as never)
        .eq("id", task.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as TaskRow;
    },
    optimisticUpdate: (current, payload) => {
      const completedAt = new Date().toISOString();
      return {
        data: (current?.data ?? []).map((task) =>
          task.id === payload.task.id
            ? {
              ...task,
              status: "completed",
              completed_at: completedAt,
              override_reason: payload.overrideReason,
              is_flagged: !!payload.overrideReason
            }
            : task
        ),
        count: current?.count ?? 0
      };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: baseKey });

      pushToast("Task Completed", `Great job! You finished "${data.title}".`);

      // Trigger achievement check
      if (userId) {
        fetch("/api/achievements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId })
        }).catch(console.error);
      }
    }
  });

  async function createTask(draft: TaskDraft) {
    return createTaskMutation.mutateAsync({
      ...draft,
      clientId: `temp-${crypto.randomUUID()}`
    });
  }

  async function deleteTask(taskId: string) {
    return deleteTaskMutation.mutateAsync(taskId);
  }

  async function completeTask(task: TaskRow) {
    let overrideReason: string | null = null;
    if (task.deadline_at && new Date(task.deadline_at).getTime() < Date.now()) {
      overrideReason = window.prompt("Deadline passed. Add reason:");
      if (!overrideReason) return;
    }
    return completeTaskMutation.mutateAsync({ task, overrideReason });
  }

  async function completeTaskFromDetail(task: TaskRow, overrideReason: string | null) {
    return completeTaskMutation.mutateAsync({ task, overrideReason });
  }

  return {
    tasksQuery,
    createTask,
    deleteTask,
    completeTask,
    completeTaskFromDetail,
    pending: {
      creating: createTaskMutation.isPending,
      deleting: deleteTaskMutation.isPending,
      completing: completeTaskMutation.isPending
    }
  };
}
