"use client";

import { cn } from "@/lib/utils";

export function HeatmapCalendar({
  data
}: {
  data: Array<{ date: string; intensity: number }>;
}) {
  return (
    <div className="grid grid-cols-7 gap-2" aria-label="Activity heatmap calendar">
      {data.map((point) => (
        <div
          key={point.date}
          title={`${point.date}: ${Math.round(point.intensity * 100)}%`}
          className={cn(
            "h-9 rounded-md border border-border",
            point.intensity <= 0.2
              ? "bg-muted/40"
              : point.intensity <= 0.4
                ? "bg-primary/25"
                : point.intensity <= 0.7
                  ? "bg-primary/50"
                  : "bg-primary/80"
          )}
        />
      ))}
    </div>
  );
}
