"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { pushToast } from "@/components/ui/toast";

export type QuickAction = {
  id: string;
  label: string;
  icon?: ReactNode;
  onRun: () => Promise<void> | void;
  disabled?: boolean;
  tooltip?: string;
  announce?: string;
};

type QuickActionBarProps = {
  actions: QuickAction[];
  className?: string;
};

export function QuickActionBar({ actions, className }: QuickActionBarProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filledId, setFilledId] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  async function runAction(action: QuickAction) {
    if (action.disabled) return;

    if (reducedMotion) {
      await action.onRun();
      pushToast(action.label, action.tooltip);
      return;
    }

    setActiveId(action.id);
    await new Promise((resolve) => setTimeout(resolve, 160));
    setFilledId(action.id);
    await action.onRun();
    await new Promise((resolve) => setTimeout(resolve, 200));
    setActiveId(null);
    setFilledId(null);
    pushToast(action.label, action.tooltip);
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="toolbar" aria-label="Quick actions">
      {actions.map((action) => {
        const isActive = activeId === action.id;
        const isFilled = filledId === action.id;
        return (
          <button
            key={action.id}
            type="button"
            disabled={action.disabled}
            title={action.tooltip}
            aria-label={action.label}
            className={cn(
              "relative inline-flex items-center justify-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm font-medium sm:px-3 sm:py-2",
              "overflow-hidden transition-all motion-reduce:transition-none",
              "duration-[160ms] ease-[var(--ease-soft)]",
              "focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-45",
              isActive ? "scale-[0.97]" : "scale-100",
              isFilled ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"
            )}
            onClick={() => runAction(action)}
          >
            <span className="relative z-[1] flex h-4 w-4 shrink-0 items-center justify-center">
              {action.icon}
            </span>
            <span className="relative z-[1] hidden sm:inline-block">
              {action.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
