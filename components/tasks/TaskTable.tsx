"use client";

import Link from "next/link";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Flag, Trash2, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TaskRow } from "@/lib/supabase/types";

function priorityTone(priority: TaskRow["priority"]) {
  if (priority === "critical") return "destructive";
  if (priority === "high") return "default";
  return "secondary";
}

export function TaskTable({
  tasks,
  onComplete,
  onDelete,
  onAddNote
}: {
  tasks: TaskRow[];
  onComplete: (task: TaskRow) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onAddNote: (task: TaskRow) => void;
}) {
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <motion.article
          key={task.id}
          layout
          layoutId={`task-card-${task.id}`}
          transition={{ duration: 0.24, ease: [0.2, 0.9, 0.2, 1] }}
          className="rounded-xl border border-border/70 bg-background/60 p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <Link href={`/tasks/${task.id}`} prefetch scroll={false} className="flex-1 min-w-0 group">
              <p className="text-sm font-semibold truncate group-hover:text-primary">{task.title}</p>
              {task.description ? (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
              ) : null}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={priorityTone(task.priority)}>{task.priority}</Badge>
                <Badge variant="secondary">{task.status}</Badge>
                {task.is_flagged ? (
                  <span className="inline-flex items-center gap-1 text-xs text-warning">
                    <Flag className="h-3 w-3" />
                    Flag
                  </span>
                ) : null}
                <span className="text-xs text-muted-foreground ml-auto inline-flex items-center gap-1">
                  Open
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {task.deadline_at ? format(new Date(task.deadline_at), "MMM d, HH:mm") : "No deadline"}
              </p>
            </Link>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={task.status === "completed"}
                  onClick={() => onComplete(task)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Done
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(task.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
              <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-primary" onClick={() => onAddNote(task)}>
                <NotebookPen className="h-3 w-3 mr-1.5" /> Context
              </Button>
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
