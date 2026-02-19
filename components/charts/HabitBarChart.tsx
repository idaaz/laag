"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export function HabitBarChart({
  data
}: {
  data: Array<{ habit: string; streak: number }>;
}) {
  return (
    <div className="h-72 w-full" aria-label="Habit streak comparison bar chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
          <XAxis dataKey="habit" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="streak" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
