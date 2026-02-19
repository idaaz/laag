"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { navItems } from "@/components/structure/nav-config";
import { MobileActionSheet } from "@/components/structure/MobileActionSheet";
import { cn } from "@/lib/utils";
import { CheckSquare, Repeat2, BarChart3, Timer, Menu, NotebookPen } from "lucide-react";
import type { QuickAction } from "@/components/structure/QuickActionBar";

type MobileTabBarProps = {
  onOpenMenu: () => void;
};

const primaryMobileNav = navItems.slice(0, 4);

export function MobileTabBar({ onOpenMenu }: MobileTabBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [actionsOpen, setActionsOpen] = useState(false);

  const quickActions: QuickAction[] = [
    {
      id: "tasks",
      label: "New Task",
      icon: <CheckSquare className="h-5 w-5" />,
      onRun: () => router.push("/tasks")
    },
    {
      id: "habits",
      label: "Log Habit",
      icon: <Repeat2 className="h-5 w-5" />,
      onRun: () => router.push("/habits")
    },
    {
      id: "logs",
      label: "Daily Log",
      icon: <BarChart3 className="h-5 w-5" />,
      onRun: () => router.push("/daily-logs")
    },
    {
      id: "notes",
      label: "New Note",
      icon: <NotebookPen className="h-5 w-5" />,
      onRun: () => router.push("/notes?action=new")
    },
    {
      id: "start",
      label: "Start Timer",
      icon: <Timer className="h-5 w-5" />,
      onRun: () => {
        document.getElementById("timer-anchor")?.scrollIntoView({ behavior: "smooth" });
      }
    },
    {
      id: "more",
      label: "All Navigation",
      icon: <Menu className="h-5 w-5" />,
      onRun: onOpenMenu
    }
  ];

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/96 px-2 pt-1 backdrop-blur-md lg:hidden"
        aria-label="Mobile navigation"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <ul className="grid grid-cols-5 gap-1">
          {primaryMobileNav.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[11px] font-medium",
                    active
                      ? "bg-primary/14 text-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.shortLabel}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setActionsOpen(true)}
              className="flex w-full flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[11px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Open actions menu"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Actions</span>
            </button>
          </li>
        </ul>
      </nav>

      <MobileActionSheet
        open={actionsOpen}
        onOpenChange={setActionsOpen}
        actions={quickActions}
      />
    </>
  );
}
