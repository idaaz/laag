"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Sheet({
  open,
  onOpenChange,
  side = "right",
  children
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "left" | "right" | "bottom";
  children: React.ReactNode;
}) {
  if (!open) return null;

  const sideClasses =
    side === "right"
      ? "top-0 right-0 h-full w-full max-w-md border-l"
      : side === "left"
        ? "top-0 left-0 h-full w-full max-w-md border-r"
        : "bottom-0 left-0 w-full h-auto border-t rounded-t-xl"; // bottom

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65"
      onClick={() => onOpenChange(false)}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={cn(
          "absolute bg-card p-5 shadow-xl transition-transform duration-200 ease-out",
          sideClasses
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 space-y-1", className)} {...props} />;
}

export function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />;
}

export function SheetDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
