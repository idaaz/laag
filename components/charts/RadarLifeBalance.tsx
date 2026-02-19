"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer
} from "recharts";

export function RadarLifeBalance({
  data
}: {
  data: Array<{ domain: string; value: number }>;
}) {
  return (
    <div className="h-80 w-full" aria-label="Life balance radar chart">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="domain" />
          <Radar
            name="Balance"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary) / 0.35)"
            fillOpacity={0.8}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
