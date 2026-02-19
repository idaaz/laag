"use client";

import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type FloatingActionButtonProps = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
};

export function FloatingActionButton({
  label,
  icon,
  onClick,
  className,
  disabled
}: FloatingActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "fixed bottom-20 right-4 z-40 rounded-full px-4 py-3",
        "inline-flex items-center gap-2 border border-primary/40 bg-primary text-primary-foreground shadow-lg",
        "transition-transform duration-[160ms] ease-[var(--ease-soft)] motion-reduce:transition-none",
        "hover:-translate-y-[1px] focus-visible:ring-0 disabled:opacity-50 disabled:cursor-not-allowed",
        "md:hidden",
        className
      )}
    >
      {icon ?? <Plus className="h-4 w-4" />}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
