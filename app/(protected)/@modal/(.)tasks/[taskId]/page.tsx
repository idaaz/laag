"use client";

import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";

export default function TaskDetailModalPage() {
  const params = useParams<{ taskId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;
  const { tasksQuery, completeTask, deleteTask } = useTasks(userId);
  const task = (tasksQuery.data?.data ?? []).find((item) => item.id === params.taskId);

  function closeModal() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/tasks");
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeModal}
      >
        <motion.div
          className="mx-auto mt-8 w-full max-w-2xl"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.2, 0.9, 0.2, 1] }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="mb-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-secondary"
            onClick={closeModal}
            aria-label="Close"
            title="Close"
          >
            <span className="inline-flex items-center gap-2">
              <X className="h-4 w-4" />
              Close
            </span>
          </button>
          {task ? (
            <TaskDetailPanel
              task={task}
              onComplete={async (item) => {
                await completeTask(item);
              }}
              onDelete={async (taskId) => {
                await deleteTask(taskId);
                closeModal();
              }}
            />
          ) : (
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              Loading task...
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
