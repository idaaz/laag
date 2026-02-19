"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function SectionHeader({
  title,
  description,
  icon,
  actions,
  className
}: SectionHeaderProps) {
  return (
    <header
      className={cn(
        "laag-grid col-span-full items-end pb-1",
        className
      )}
      role="region"
      aria-label={`${title} section controls`}
    >
      <div className="col-span-full md:col-span-4 lg:col-span-8 space-y-1">
        <h1 className="text-[22px] leading-tight font-heading font-medium tracking-tight flex items-center gap-2">
          {icon ? <span className="text-primary">{icon}</span> : null}
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-muted-foreground leading-5">{description}</p>
        ) : null}
      </div>
      <div className="col-span-full md:col-span-2 lg:col-span-4 flex justify-start md:justify-end gap-2">
        {actions}
      </div>
    </header>
  );
}
