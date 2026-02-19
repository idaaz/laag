"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { LayoutGroup } from "framer-motion";
import { SideRail } from "@/components/structure/SideRail";
import { TopNav } from "@/components/structure/TopNav";
import { BottomTaskBar } from "@/components/structure/BottomTaskBar";

import { MobileFluidNav } from "@/components/structure/MobileFluidNav";
import { MobileHeader } from "@/components/structure/MobileHeader";

type ProtectedShellProps = {
  children: ReactNode;
  modal?: ReactNode;
  initialEmail?: string | null;
};

export function ProtectedShell({ children, modal, initialEmail }: ProtectedShellProps) {
  const [railExpanded, setRailExpanded] = useState(true);
  const [mobileRailOpen, setMobileRailOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground lg:pb-0">
      <MobileHeader />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <TopNav
        initialEmail={initialEmail}
        railExpanded={railExpanded}
        onToggleRail={() => setRailExpanded((current) => !current)}
        onToggleMobileRail={() => setMobileRailOpen((current) => !current)}
      />
      <LayoutGroup id="laag-shared-layout">
        <div className="h-[calc(100vh-64px)] px-0 pt-14 lg:px-4 lg:py-3 lg:pb-24">
          <div className="h-full grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)] gap-3">
            <SideRail
              expanded={railExpanded}
              mobileOpen={mobileRailOpen}
              onCloseMobile={() => setMobileRailOpen(false)}
            />
            <main
              id="main-content"
              className="h-full min-h-0 overflow-hidden rounded-none border-0 bg-transparent p-0 lg:rounded-xl lg:border lg:border-border/80 lg:bg-card/35 lg:p-3"
            >
              <div className="h-full overflow-y-auto px-3 pb-2 laag-scroll lg:px-0 lg:pb-0 mb-10 lg:mb-0">
                {children}
              </div>
            </main>
          </div>
        </div>
        {modal}
      </LayoutGroup>
      <MobileFluidNav />
      <BottomTaskBar />
    </div>
  );
}
