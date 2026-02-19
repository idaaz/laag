"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "@/components/structure/nav-config";

type SideRailProps = {
  expanded: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

function NavLinks({ expanded, onNavigate }: { expanded: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1" aria-label="Primary navigation">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-2 rounded-lg border px-2 py-2 text-sm",
              "transition-all duration-[220ms] ease-out motion-reduce:transition-none",
              active
                ? "border-primary/40 bg-primary/14 text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground"
            )}
            title={!expanded ? item.label : undefined}
            aria-current={active ? "page" : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className={cn("truncate", expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden")}>
              {item.shortLabel}
            </span>
            {!expanded ? <span className="sr-only">{item.label}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function SideRail({ expanded, mobileOpen, onCloseMobile }: SideRailProps) {
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseMobile();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, onCloseMobile]);

  return (
    <>
      <aside
        id="app-rail-desktop"
        className={cn(
          "hidden lg:block h-full rounded-xl border border-border/80 bg-card/70 p-2 overflow-y-auto laag-scroll",
          "transition-[width,opacity,transform] duration-[220ms] ease-out motion-reduce:transition-none",
          expanded ? "w-[220px]" : "w-[70px]"
        )}
        aria-label="Sidebar"
      >
        <NavLinks expanded={expanded} />
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-50 bg-background/70 backdrop-blur-sm lg:hidden",
          "transition-opacity duration-[220ms] ease-out motion-reduce:transition-none",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onCloseMobile}
        aria-hidden={!mobileOpen}
      />
      <aside
        id="app-rail-mobile"
        className={cn(
          "fixed left-0 top-0 z-[55] h-screen w-[244px] border-r border-border/80 bg-card p-3 lg:hidden",
          "transition-all duration-[220ms] ease-out motion-reduce:transition-none",
          mobileOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
        )}
        aria-label="Mobile sidebar"
        aria-hidden={!mobileOpen}
      >
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Navigate</p>
        <NavLinks expanded onNavigate={onCloseMobile} />
      </aside>
    </>
  );
}
