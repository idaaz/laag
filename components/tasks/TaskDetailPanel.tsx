"use client";

import { format } from "date-fns";
import { motion } from "framer-motion";
import { Pause, Play, Square, Trash2 } from "lucide-react";
import { useActiveTask } from "@/components/active-task/ActiveTaskContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TaskRow } from "@/lib/supabase/types";

type TaskDetailPanelProps = {
  task: TaskRow;
  onComplete: (task: TaskRow) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
};

export function TaskDetailPanel({ task, onComplete, onDelete }: TaskDetailPanelProps) {
  const { session, startTask, pauseTask, resumeTask, stopTask } = useActiveTask();
  const isActive = session?.taskId === task.id;
  const isRunning = isActive && session?.running;

  return (
    <motion.section
      layoutId={`task-card-${task.id}`}
      transition={{ duration: 0.26, ease: [0.2, 0.9, 0.2, 1] }}
      className="rounded-xl border border-border/70 bg-card p-4 space-y-4"
    >
      <header className="space-y-2">
        <p className="text-xs text-muted-foreground">Task</p>
        <h2 className="text-xl font-semibold leading-tight">{task.title}</h2>
        {task.description ? <p className="text-sm text-muted-foreground">{task.description}</p> : null}
      </header>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-border/70 bg-background/70 px-2 py-1">
          <p className="text-muted-foreground">Priority</p>
          <Badge variant={task.priority === "critical" ? "destructive" : "secondary"} className="mt-1">
            {task.priority}
          </Badge>
        </div>
        <div className="rounded-lg border border-border/70 bg-background/70 px-2 py-1">
          <p className="text-muted-foreground">Status</p>
          <Badge variant="secondary" className="mt-1">{task.status}</Badge>
        </div>
        <div className="rounded-lg border border-border/70 bg-background/70 px-2 py-1 col-span-2">
          <p className="text-muted-foreground">Deadline</p>
          <p className="text-sm mt-1">
            {task.deadline_at ? format(new Date(task.deadline_at), "EEE, MMM d HH:mm") : "No deadline"}
          </p>
        </div>
      </div>

      <section className="rounded-lg border border-primary/30 bg-primary/10 p-3 space-y-2">
        <p className="text-xs text-muted-foreground">Deep Work</p>
        <div className="flex flex-wrap items-center gap-2">
          {!isActive ? (
            <>
              <Button
                size="sm"
                onClick={() =>
                  startTask({ taskId: task.id, title: task.title, sessionType: "pomodoro", durationMinutes: 25 })
                }
              >
                <Play className="h-3.5 w-3.5" />
                Start
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  startTask({ taskId: task.id, title: task.title, sessionType: "deep_work", durationMinutes: 50 })
                }
              >
                Focus
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => (isRunning ? pauseTask() : resumeTask())}>
                {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {isRunning ? "Pause" : "Resume"}
              </Button>
              <Button size="sm" variant="ghost" onClick={stopTask}>
                <Square className="h-3.5 w-3.5" />
                Stop
              </Button>
              <p className="text-xs text-muted-foreground tabular-nums ml-1">
                {Math.floor((session?.secondsLeft ?? 0) / 60)
                  .toString()
                  .padStart(2, "0")}
                :
                {((session?.secondsLeft ?? 0) % 60).toString().padStart(2, "0")}
              </p>
            </>
          )}
        </div>
      </section>

      <footer className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => onComplete(task)}
          disabled={task.status === "completed"}
        >
          {task.status === "completed" ? "Completed" : "Complete"}
        </Button>
        <Button variant="destructive" onClick={() => onDelete(task.id)}>
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </footer>
    </motion.section>
  );
}
