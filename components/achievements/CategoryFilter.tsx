import { cn } from "@/lib/utils";

export const CATEGORY_CONFIG = {
    tasks: { label: "Task Master", color: "hsl(var(--chart-1))" },
    habits: { label: "Habit Hero", color: "hsl(var(--chart-2))" },
    productivity: { label: "Productivity Genius", color: "hsl(var(--chart-3))" },
    analytics: { label: "Analytics Ace", color: "hsl(var(--chart-4))" },
    wellness: { label: "Wellness Warrior", color: "hsl(var(--chart-5))" },
    social: { label: "Social Connector", color: "hsl(210 40% 60%)" },
    milestones: { label: "Milestones", color: "hsl(280 60% 60%)" },
    special: { label: "Special", color: "hsl(340 75% 55%)" }
} as const;

interface CategoryFilterProps {
    selected: string | null;
    onSelect: (category: string | null) => void;
    counts: Record<string, number>;
}

export function CategoryFilter({ selected, onSelect, counts }: CategoryFilterProps) {
    return (
        <div className="flex flex-wrap gap-2">
            <button
                onClick={() => onSelect(null)}
                className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    selected === null
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/60 hover:bg-muted text-muted-foreground"
                )}
            >
                All ({Object.values(counts).reduce((sum, count) => sum + count, 0)})
            </button>

            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <button
                    key={key}
                    onClick={() => onSelect(key)}
                    className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        selected === key
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/60 hover:bg-muted text-muted-foreground"
                    )}
                >
                    {config.label} ({counts[key] || 0})
                </button>
            ))}
        </div>
    );
}
