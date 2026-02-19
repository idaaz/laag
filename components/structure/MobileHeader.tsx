"use client";

import { usePathname } from "next/navigation";
import { navItems } from "@/components/structure/nav-config";

export function MobileHeader() {
    const pathname = usePathname();

    // Find the current nav item based on pathname
    const currentItem = navItems.find(item => item.href === pathname);
    const title = currentItem?.label || "LAAG";

    return (
        <header className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-center border-b border-border/80 bg-background/95 backdrop-blur-md lg:hidden">
            <h1 className="text-sm font-bold uppercase tracking-widest text-foreground/90">
                {title}
            </h1>
        </header>
    );
}
