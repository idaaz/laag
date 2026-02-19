import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type InsightCardProps = {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    className?: string;
};

export function InsightCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendValue,
    className
}: InsightCardProps) {
    return (
        <article className={cn("rounded-xl border border-border/70 bg-background/60 p-3", className)}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{title}</p>
                    <p className="text-2xl font-semibold mt-1 tabular-nums">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                    )}
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="rounded-md bg-primary/10 p-2">
                        <Icon className="h-4 w-4 text-primary" />
                    </div>
                    {trend && trendValue && (
                        <div className={cn(
                            "text-xs font-medium",
                            trend === "up" && "text-green-600 dark:text-green-400",
                            trend === "down" && "text-red-600 dark:text-red-400",
                            trend === "neutral" && "text-muted-foreground"
                        )}>
                            {trend === "up" && "↗"} {trend === "down" && "↘"} {trendValue}
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}
