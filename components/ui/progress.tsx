import * as React from "react";
import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  const normalized = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-1 w-full overflow-hidden bg-secondary", className)}>
      <div
        className="h-full bg-primary transition-all shadow-[0_0_10px_rgba(6,182,212,0.5)]"
        style={{ width: `${normalized}%` }}
      />
    </div>
  );
}
