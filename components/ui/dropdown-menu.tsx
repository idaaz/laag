"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DropdownMenu({ trigger, children, className }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className={cn("relative inline-block text-left", className)} ref={containerRef}>
      <button type="button" onClick={() => setOpen((value) => !value)} className="w-full">
        {trigger}
      </button>
      {open ? (
        <div className="absolute right-0 z-[100] mt-2 w-56 rounded-xl border border-white/10 bg-[#0f172a] p-1.5 shadow-2xl ring-1 ring-black/5 motion-in-from-top-1 motion-in-duration-200">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm hover:bg-muted",
        className
      )}
      {...props}
    />
  );
}
