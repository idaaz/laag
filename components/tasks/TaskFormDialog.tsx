"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { taskSchema } from "@/lib/validators/schemas";

type TaskDraft = {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  deadline_at: string | null;
};

export function TaskFormDialog({
  open,
  onOpenChange,
  onSubmit
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (draft: TaskDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<TaskDraft>({
    title: "",
    description: "",
    priority: "medium",
    deadline_at: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    const parsed = taskSchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid task input.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(draft);
      setDraft({ title: "", description: "", priority: "medium", deadline_at: null });
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save task.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>
            Be explicit. Vague tasks are friction disguised as planning.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={draft.title}
              onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Ship analytics dashboard"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={draft.description}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <select
                id="task-priority"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={draft.priority}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    priority: event.target.value as TaskDraft["priority"]
                  }))
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-deadline">Deadline</Label>
              <Input
                id="task-deadline"
                type="datetime-local"
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    deadline_at: event.target.value
                      ? new Date(event.target.value).toISOString()
                      : null
                  }))
                }
              />
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Save Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
