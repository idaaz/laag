"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { navItems } from "@/components/structure/nav-config";
import { cn } from "@/lib/utils";

export function MobileFluidNav() {
    const [isOpen, setIsOpen] = useState(false);

    const pathname = usePathname();
    const router = useRouter();

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const onItemClick = (href: Route) => {
        router.push(href);
        setIsOpen(false);
    };

    // Reverse nav items for upward stacking (Dashboard at top, Tracking at bottom)
    const stackedItems = [...navItems].reverse();

    return (
        <div className="fixed bottom-24 left-6 z-[9999] lg:hidden select-none">
            {/* Tab List */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute bottom-16 left-0 mb-2 w-48 space-y-1"
                    >
                        {stackedItems.map((item, idx) => {
                            const isActive = pathname === item.href;

                            return (
                                <motion.div
                                    key={item.href}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: (stackedItems.length - idx) * 0.03 }}
                                    onClick={() => onItemClick(item.href)}
                                    className={cn(
                                        "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-all active:scale-95",
                                        isActive
                                            ? "border-primary/20 bg-primary/10 text-foreground"
                                            : "border-border/60 bg-card/95 text-muted-foreground shadow-lg backdrop-blur-md hover:bg-secondary"
                                    )}
                                >
                                    <item.icon className="h-4 w-4 shrink-0" />
                                    <span>{item.label}</span>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hamburger Button */}
            <motion.button
                onClick={toggleMenu}
                whileTap={{ scale: 0.9 }}
                className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full border border-border/80 shadow-xl backdrop-blur-md transition-all duration-300",
                    isOpen ? "bg-primary text-white" : "bg-card/95 text-foreground"
                )}
                aria-label="Toggle navigation menu"
            >
                {isOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6" />}
            </motion.button>
        </div>
    );
}
