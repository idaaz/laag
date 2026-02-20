"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, Activity, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "@/components/structure/nav-config";
import { SearchOverlay } from "@/components/structure/SearchOverlay";
import { useMobileKPI } from "@/lib/context/MobileKPIContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type QuoteData = {
    q: string;
    a: string;
};

export function MobileFluidNav() {
    const [navOpen, setNavOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [quote, setQuote] = useState<QuoteData | null>(null);
    const [quotePopupOpen, setQuotePopupOpen] = useState(false);

    const pathname = usePathname();
    const router = useRouter();
    const { kpis, isOpen: isKPIOpen, setIsOpen: setIsKPIOpen } = useMobileKPI();

    // Context flags
    const showPlusButton = ["/tasks", "/habits", "/daily-logs", "/notes"].includes(pathname);

    // Always show 4 buttons as requested, but disable/dim if current context doesn't support them?
    // User specifically asked for 4 fixed buttons.
    const showKPIButton = true; // Always show even if no kpis (could show empty or hint)
    const showSearchButton = true;
    const showNavButton = true;
    const showAddButton = true;

    // Show quote on all screens now as requested
    const showQuote = true;

    useEffect(() => {
        if (showQuote && !quote) {
            fetch("/api/quote")
                .then(res => res.json())
                .then(data => {
                    if (data?.q) {
                        setQuote({ q: data.q, a: data.a });
                    }
                })
                .catch(err => console.error("Failed to load quote", err));
        }
    }, [showQuote, quote]);

    const handlePlusClick = () => {
        if (pathname === "/tasks") router.push("/tasks?action=new" as never);
        else if (pathname === "/habits") router.push("/habits?action=new" as never);
        else if (pathname === "/daily-logs") router.push("/daily-logs?action=new" as never);
        else if (pathname === "/notes") router.push("/notes?action=new" as never);
        else {
            // Fallback for pages without a specific "+" action
            setNavOpen(true);
        }
    };

    const stackedItems = [...navItems].reverse();

    return (
        <>
            {/* The main footer */}
            <div className="fixed bottom-0 left-0 right-0 z-[50] border-t border-border/80 bg-card/95 backdrop-blur-md"
                style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}>
                <div className="flex h-14 items-center justify-between px-3">

                    {/* Left: Hamburger */}
                    <button
                        onClick={() => setNavOpen(!navOpen)}
                        className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors lg:hidden",
                            navOpen ? "bg-primary text-white" : "bg-card border border-border/60 hover:bg-secondary"
                        )}
                        aria-label="Toggle navigation"
                    >
                        {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>

                    {/* Center: Quote */}
                    {showQuote && quote && (
                        <div
                            className="flex flex-1 flex-col justify-center px-4 overflow-hidden cursor-pointer"
                            onClick={() => setQuotePopupOpen(true)}
                        >
                            <p className="line-clamp-2 text-center text-[10px] font-medium leading-tight text-foreground/80">
                                &quot;{quote.q}&quot;
                            </p>
                            <p className="truncate text-center text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">
                                {quote.a}
                            </p>
                        </div>
                    )}

                    {!quote && <div className="flex-1" />}

                    {/* Right side buttons */}
                    <div className="flex items-center gap-2 shrink-0 lg:hidden">
                        <button
                            onClick={() => setIsKPIOpen(!isKPIOpen)}
                            className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                                isKPIOpen ? "bg-primary text-white" : "bg-card border border-border/60 hover:bg-secondary"
                            )}
                            aria-label="Toggle KPIs"
                        >
                            <Activity className="h-4 w-4" />
                        </button>

                        <button
                            onClick={() => setSearchOpen(true)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border/60 hover:bg-secondary transition-colors"
                            aria-label="Search"
                        >
                            <Search className="h-4 w-4" />
                        </button>

                        <button
                            onClick={handlePlusClick}
                            className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-full transition-colors shadow-md bg-primary text-white hover:bg-primary/90"
                            )}
                            aria-label="Add new item"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Zero-Lag Navigation Menu Overlay */}
            {navOpen && (
                <div
                    className="fixed inset-0 z-[40] bg-background/95 backdrop-blur-md lg:hidden"
                    onClick={() => setNavOpen(false)}
                >
                    <div
                        className="absolute bottom-16 left-4 right-4 max-h-[70vh] overflow-y-auto space-y-1 pb-safe"
                        onClick={e => e.stopPropagation()}
                    >
                        {stackedItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <div
                                    key={item.href}
                                    onClick={() => {
                                        router.push(item.href);
                                        setNavOpen(false);
                                    }}
                                    className={cn(
                                        "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors select-none",
                                        isActive
                                            ? "border-primary/20 bg-primary/10 text-foreground"
                                            : "border-border/60 bg-card/95 text-muted-foreground active:bg-secondary"
                                    )}
                                >
                                    <item.icon className="h-5 w-5 shrink-0" />
                                    <span>{item.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

            {/* Quote Popup */}
            <Dialog open={quotePopupOpen} onOpenChange={setQuotePopupOpen}>
                <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-white/10 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            Daily Inspiration
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <p className="text-xl md:text-2xl font-semibold tracking-tight leading-relaxed italic text-foreground">
                            &quot;{quote?.q}&quot;
                        </p>
                        <div className="flex justify-end pr-2">
                            <span className="text-sm font-medium uppercase tracking-wider text-primary">— {quote?.a}</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
