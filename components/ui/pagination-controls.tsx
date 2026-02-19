"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaginationControlsProps = {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
    className?: string;
    itemCount?: number; // Optional: hide pagination if no items
};

export function PaginationControls({
    currentPage,
    totalPages,
    onPageChange,
    isLoading,
    className,
    itemCount
}: PaginationControlsProps) {
    // Hide if only 1 page or if there are explicitly no items
    if (totalPages <= 1 || (itemCount !== undefined && itemCount === 0)) return null;

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages: (number | null)[] = [];
        // Always show first, last, and around current
        // Simple version: just show all if < 7, otherwise condensed
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 4) {
                // Start: 1 2 3 4 5 ... 10
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push(null); // ellipsis
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 3) {
                // End: 1 ... 6 7 8 9 10
                pages.push(1);
                pages.push(null);
                for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
            } else {
                // Middle: 1 ... 4 5 6 ... 10
                pages.push(1);
                pages.push(null);
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push(null);
                pages.push(totalPages);
            }
        }
        return pages;
    };

    const pages = getPageNumbers();

    return (
        <div className={cn("flex items-center justify-center gap-1.5 py-6 pt-8 border-t border-border/50 mt-4", className)}>
            <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-md hover:bg-primary/10"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                aria-label="Previous page"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
                {pages.map((page, idx) => {
                    if (page === null) {
                        return (
                            <span key={`ellipsis-${idx}`} className="text-muted-foreground text-sm px-2 select-none">
                                ···
                            </span>
                        );
                    }
                    return (
                        <Button
                            key={page}
                            variant={page === currentPage ? "default" : "ghost"}
                            size="sm"
                            className={cn(
                                "h-9 min-w-[2.25rem] px-3 rounded-md transition-all",
                                page === currentPage
                                    ? "shadow-sm pointer-events-none font-semibold"
                                    : "hover:bg-primary/10"
                            )}
                            onClick={() => onPageChange(page)}
                            disabled={isLoading}
                        >
                            {page}
                        </Button>
                    );
                })}
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-md hover:bg-primary/10"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
                aria-label="Next page"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
