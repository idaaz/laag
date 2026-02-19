"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search tasks..."
          className="pl-9"
        />
      </div>
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
