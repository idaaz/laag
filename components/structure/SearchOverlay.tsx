"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

export function SearchOverlay({
    open,
    onClose
}: {
    open: boolean;
    onClose: () => void;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(searchParams.get("q") || "");

    const getTabName = (path: string) => {
        const last = path.split("/").pop();
        if (last === "daily-logs") return "Logs";
        return last?.charAt(0).toUpperCase() + (last?.slice(1) || "");
    };

    if (!open) return null;

    const handleSearch = (val: string) => {
        setQuery(val);
        const params = new URLSearchParams(searchParams.toString());
        if (val) params.set("q", val);
        else params.delete("q");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-[99999] bg-card border-b border-border/80 shadow-lg animate-in slide-in-from-top duration-200">
            <div className="flex h-14 items-center gap-3 px-4 max-w-screen-xl mx-auto">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                    autoFocus
                    placeholder={`Search ${getTabName(pathname)}...`}
                    className="flex-1 h-full border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
                    value={query}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                />
                <button
                    onClick={onClose}
                    className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}
