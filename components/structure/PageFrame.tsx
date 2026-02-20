"use client";

import type { ReactNode } from "react";

type PageFrameProps = {
  header: ReactNode;
  children: ReactNode;
};

export function PageFrame({ header, children }: PageFrameProps) {
  return (
    <section className="h-full min-h-0 flex flex-col gap-1">
      <div className="flex-none">{header}</div>
      <div className="flex-1 min-h-0 overflow-y-auto laag-scroll">
        <div className="laag-grid auto-rows-min">{children}</div>
      </div>
    </section>
  );
}
