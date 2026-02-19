import { cn } from "@/lib/utils";

type KPIItem = {
    label: string;
    value: string | number;
    color?: "success" | "danger" | "warning" | "info" | "focus" | "score" | "achievement" | "calibration" | "pill" | "default";
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
                        role="status"
                        aria-label={`${item.label}: ${item.value}`}
                    >
                        <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                        <p
                            className={cn(
                                "text-lg font-bold tabular-nums",
                                item.color === "success" && "text-[var(--k-green)]",
                                item.color === "danger" && "text-[var(--k-red)]",
                                item.color === "warning" && "text-[var(--k-orange)]",
                                item.color === "info" && "text-[var(--k-blue)]",
                                item.color === "focus" && "text-[var(--k-teal)]",
                                item.color === "score" && "text-[var(--k-indigo)]",
                                item.color === "achievement" && "text-[var(--k-gold)]",
                                item.color === "calibration" && "text-[var(--k-purple)]",
                                item.color === "pill" && "inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-[var(--k-blue-700)] text-white text-xs"
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
