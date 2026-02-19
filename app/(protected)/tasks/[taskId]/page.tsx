"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";

export default function TaskDetailPage() {
  const params = useParams<{ taskId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;
  const { tasksQuery, completeTask, deleteTask } = useTasks(userId);
  const task = (tasksQuery.data?.data ?? []).find((item) => item.id === params.taskId);

  if (!task) {
    return (
      <div className="p-3 text-sm text-muted-foreground">
        Loading task...
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex items-start justify-center p-3">
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.2, 0.9, 0.2, 1] }}
      >
        <Link href="/tasks" prefetch className="inline-flex mb-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">
          <span className="inline-flex items-center gap-2">
            <X className="h-4 w-4" />
            Close
          </span>
        </Link>
        <TaskDetailPanel
          task={task}
          onComplete={async (item) => {
            await completeTask(item);
          }}
          onDelete={async (taskId) => {
            await deleteTask(taskId);
            router.push("/tasks");
          }}
        />
      </motion.div>
    </div>
  );
}
