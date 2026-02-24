"use client";

import { Bell, Trophy, Target, Sparkles, MessageSquare, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

const TYPE_CONFIG = {
    achievement: { icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
    milestone: { icon: Target, color: "text-primary", bg: "bg-primary/10" },
    insight: { icon: Sparkles, color: "text-purple-500", bg: "bg-purple-500/10" },
    vision: { icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10" },
    system: { icon: Info, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    default: { icon: Bell, color: "text-muted-foreground", bg: "bg-muted" },
};

export function NotificationPopover({ userId }: { userId?: string }) {
    const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications(userId);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card",
                        "transition-colors duration-[200ms] ease-[var(--ease-soft)] motion-reduce:transition-none",
                        "hover:bg-secondary"
                    )}
                    aria-label={`Notifications ${unreadCount > 0 ? `${unreadCount} unread` : "none unread"}`}
                    title="Notifications"
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 ? (
                        <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    ) : null}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between border-b px-4 py-2 bg-secondary/20">
                    <h3 className="text-sm font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 py-1 text-[10px] uppercase font-bold text-primary hover:bg-primary/5 active:scale-95 transition-all"
                            onClick={() => markAllAsRead.mutate()}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <div className="max-h-80 overflow-y-auto laag-scroll">
                    {isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                            <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className="flex flex-col divide-y divide-border/20">
                            {notifications.map((n) => {
                                const config = TYPE_CONFIG[n.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.default;
                                return (
                                    <button
                                        key={n.id}
                                        className={cn(
                                            "flex items-start gap-3 px-4 py-3 text-left transition-all",
                                            !n.is_read
                                                ? "bg-primary/[0.03] hover:bg-primary/[0.06]"
                                                : "opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 hover:bg-muted/30"
                                        )}
                                        onClick={() => !n.is_read && markAsRead.mutate(n.id)}
                                    >
                                        <div className={cn(
                                            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110",
                                            config.bg
                                        )}>
                                            <config.icon className={cn("h-4 w-4", config.color)} />
                                        </div>
                                        <div className="flex-1 space-y-1 overflow-hidden">
                                            <div className="flex items-center justify-between gap-1">
                                                <p className={cn(
                                                    "truncate text-xs font-semibold",
                                                    !n.is_read ? "text-foreground" : "text-muted-foreground"
                                                )}>{n.title}</p>
                                                <span className="whitespace-nowrap text-[9px] font-mono text-muted-foreground/70">
                                                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="line-clamp-2 text-[11px] text-muted-foreground/80 leading-relaxed">
                                                {n.message}
                                            </p>
                                        </div>
                                        {!n.is_read && (
                                            <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_5px_rgba(var(--primary-rgb),0.5)]" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex h-40 flex-col items-center justify-center text-center p-4">
                            <Bell className="mb-2 h-8 w-8 text-muted-foreground/10" />
                            <p className="text-xs text-muted-foreground">No notifications yet</p>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover >
    );
}
