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
  const triggerHaptic = () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  };

  const handlePress = () => {
    triggerHaptic();
    onClick();
  };

  return (
    <button
      type="button"
      onClick={handlePress}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "fixed bottom-24 right-6 z-40 h-14 w-14 rounded-full",
        "flex items-center justify-center border border-primary/40 bg-primary shadow-[0_8px_32px_rgba(var(--primary-rgb),0.4)]",
        "transition-all duration-200 active:scale-90",
        "md:hidden",
        className
      )}
    >
      {icon ?? <Plus className="h-6 w-6 text-primary-foreground" />}
    </button>
  );
}
