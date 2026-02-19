"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type CompactListItemProps = {
  label: string;
  meta?: string;
  icon?: ReactNode;
  controls?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
};

export function CompactListItem({
  label,
  meta,
  icon,
  controls,
  selected,
  onClick
}: CompactListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg border px-3 py-2",
        "inline-flex items-center gap-3",
        "transition-all duration-[200ms] ease-[var(--ease-soft)] motion-reduce:transition-none",
        "focus-visible:ring-0",
        selected
          ? "border-primary/60 bg-primary/10"
          : "border-border/70 bg-background/40 hover:bg-secondary/80"
      )}
      aria-pressed={selected}
    >
      {icon ? <span className="text-primary">{icon}</span> : null}
      <span className="flex-1 min-w-0">
        <span className="block truncate text-sm font-medium">{label}</span>
        {meta ? <span className="block truncate text-xs text-muted-foreground">{meta}</span> : null}
      </span>
      {controls ? <span className="flex items-center gap-1">{controls}</span> : null}
      {!controls ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /> : null}
    </button>
  );
}
