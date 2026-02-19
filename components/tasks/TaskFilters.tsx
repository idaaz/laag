"use client";

import { Input } from "@/components/ui/input";

export function TaskFilters({
  query,
  onQueryChange,
  status,
  onStatusChange
}: {
  query: string;
  onQueryChange: (value: string) => void;
  status: "all" | "todo" | "in_progress" | "completed";
  onStatusChange: (value: "all" | "todo" | "in_progress" | "completed") => void;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-[1fr,200px]">
      <Input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search tasks..."
      />
      <select
        className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        value={status}
        onChange={(event) =>
          onStatusChange(event.target.value as "all" | "todo" | "in_progress" | "completed")
        }
      >
        <option value="all">All statuses</option>
        <option value="todo">Todo</option>
        <option value="in_progress">In progress</option>
        <option value="completed">Completed</option>
      </select>
    </div>
  );
}
