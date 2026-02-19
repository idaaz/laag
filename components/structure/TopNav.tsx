"use client";

import Link from "next/link";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { NotificationPopover } from "@/components/notifications/NotificationPopover";
import { useAuth } from "@/hooks/useAuth";

type TopNavProps = {
  initialEmail?: string | null;
  railExpanded: boolean;
  onToggleRail: () => void;
  onToggleMobileRail: () => void;
  unreadCount?: number;
};

export function TopNav({
  railExpanded,
  onToggleRail,
  onToggleMobileRail,
}: TopNavProps) {
  const router = useRouter();
  const { user } = useAuth();
  // ... (rest same, just used in jsx)

  useEffect(() => {
    router.prefetch("/dashboard");
    router.prefetch("/tasks");
    router.prefetch("/habits");
    router.prefetch("/daily-logs");
    router.prefetch("/notes");
    router.prefetch("/tracking");
    router.prefetch("/analytics");
    router.prefetch("/achievements");
    router.prefetch("/settings");
  }, [router]);

  return (
    <header className="hidden lg:block border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="laag-grid px-4 py-3">
        <div className="col-span-full md:col-span-3 lg:col-span-4 flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card lg:hidden"
            onClick={onToggleMobileRail}
            aria-label="Open navigation"
            aria-controls="app-rail-mobile"
          >
            <Menu className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card"
            onClick={onToggleRail}
            aria-label={railExpanded ? "Collapse sidebar" : "Expand sidebar"}
            aria-controls="app-rail-desktop"
            aria-expanded={railExpanded}
            title={railExpanded ? "Collapse" : "Expand"}
          >
            {railExpanded ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </button>
          <Link href="/dashboard" prefetch className="flex items-center gap-2" aria-label="Go to dashboard">
            <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-sm font-semibold text-primary">
              LAAG
            </span>
            <span className="hidden sm:inline text-sm text-muted-foreground">Discipline OS</span>
          </Link>
        </div>

        <div className="col-span-full md:col-span-3 lg:col-span-8 flex items-center justify-end gap-2">
          <NotificationPopover userId={user?.id} />
        </div>
      </div>
    </header>
  );
}
