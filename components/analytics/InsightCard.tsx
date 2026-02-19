import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type InsightCardProps = {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    tone?: "default" | "success" | "danger" | "warning" | "info" | "focus" | "score" | "achievement" | "calibration";
    className?: string;
};

export function InsightCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendValue,
    tone = "default",
    className
}: InsightCardProps) {
    return (
        <article
            className={cn("rounded-xl border border-border/70 bg-background/60 p-3", className)}
            role="status"
            aria-label={`${title}: ${value}${trend && trendValue ? `, trending ${trend} by ${trendValue}` : ""}`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{title}</p>
                    <p className={cn(
                        "text-2xl font-semibold mt-1 tabular-nums",
                        tone === "success" && "text-[var(--k-green)]",
                        tone === "danger" && "text-[var(--k-red)]",
                        tone === "warning" && "text-[var(--k-orange)]",
                        tone === "info" && "text-[var(--k-blue)]",
                        tone === "focus" && "text-[var(--k-teal)]",
                        tone === "score" && "text-[var(--k-indigo)]",
                        tone === "achievement" && "text-[var(--k-gold)]",
                        tone === "calibration" && "text-[var(--k-purple)]"
                    )}>
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                    )}
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className={cn(
                        "rounded-md p-2",
                        tone === "success" && "bg-[var(--k-green)]/10",
                        tone === "danger" && "bg-[var(--k-red)]/10",
                        tone === "warning" && "bg-[var(--k-orange)]/10",
                        tone === "info" && "bg-[var(--k-blue)]/10",
                        tone === "focus" && "bg-[var(--k-teal)]/10",
                        tone === "score" && "bg-[var(--k-indigo)]/10",
                        tone === "achievement" && "bg-[var(--k-gold)]/10",
                        tone === "calibration" && "bg-[var(--k-purple)]/10",
                        tone === "default" && "bg-primary/10"
                    )}>
                        <Icon className={cn(
                            "h-4 w-4",
                            tone === "success" && "text-[var(--k-green)]",
                            tone === "danger" && "text-[var(--k-red)]",
                            tone === "warning" && "text-[var(--k-orange)]",
                            tone === "info" && "text-[var(--k-blue)]",
                            tone === "focus" && "text-[var(--k-teal)]",
                            tone === "score" && "text-[var(--k-indigo)]",
                            tone === "achievement" && "text-[var(--k-gold)]",
                            tone === "calibration" && "text-[var(--k-purple)]",
                            tone === "default" && "text-primary"
                        )} />
                    </div>
                    {trend && trendValue && (
                        <div className={cn(
                            "text-xs font-medium",
                            trend === "up" && "text-[var(--k-green)]",
                            trend === "down" && "text-[var(--k-red)]",
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
