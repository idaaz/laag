import { cn } from "@/lib/utils";

type KPIItem = {
    label: string;
    value: string | number;
    color?: "success" | "warning" | "destructive" | "default";
    trend?: "up" | "down" | "neutral";
};

type KPIPanelProps = {
    title?: string;
    items: KPIItem[];
    className?: string;
};

export function KPIPanel({ title = "Overview", items, className }: KPIPanelProps) {
    return (
        <div className={cn("rounded-xl border border-border/80 bg-card/85 p-4", className)}>
            {title && <h3 className="text-sm font-semibold mb-3">{title}</h3>}
            <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="rounded-lg border border-border/70 bg-background/60 p-3"
                    >
                        <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                        <p
                            className={cn(
                                "text-lg font-bold tabular-nums",
                                item.color === "success" && "text-green-600 dark:text-green-400",
                                item.color === "warning" && "text-yellow-600 dark:text-yellow-400",
                                item.color === "destructive" && "text-red-600 dark:text-red-400"
                            )}
                        >
                            {item.value}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
