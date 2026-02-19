"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type AppCardProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  hint?: string;
  actions?: ReactNode;
  padded?: boolean;
};

export function AppCard({
  title,
  hint,
  actions,
  children,
  className,
  padded = true,
  ...rest
}: AppCardProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border/80 bg-card/85 shadow-[0_4px_18px_hsla(var(--foreground)/0.08)]",
        "transition-shadow duration-[200ms] ease-[var(--ease-soft)] motion-reduce:transition-none",
        "hover:shadow-[0_10px_26px_hsla(var(--foreground)/0.14)]",
        className
      )}
      {...rest}
    >
      {title || hint || actions ? (
        <div className="flex items-center justify-between gap-3 p-3 border-b border-border/70">
          <div className="space-y-1">
            {title ? <h2 className="text-base font-semibold leading-5">{title}</h2> : null}
            {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn(padded ? "p-3" : "")}>{children}</div>
    </section>
  );
}
