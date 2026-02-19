import { cn } from "@/lib/utils";

interface ProgressRingProps {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    className?: string;
}

export function ProgressRing({
    percentage,
    size = 120,
    strokeWidth = 8,
    className
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className={cn("relative inline-flex items-center justify-center", className)}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                />
            </svg>
            {/* Percentage text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tabular-nums">{Math.round(percentage)}%</span>
                <span className="text-xs text-muted-foreground">Complete</span>
            </div>
        </div>
    );
}
