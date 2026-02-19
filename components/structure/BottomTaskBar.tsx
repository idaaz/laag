"use client";

import { useEffect, useState } from "react";
import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ZenQuote } from "@/lib/services/zenquotes";

export function BottomTaskBar() {
  const [quote, setQuote] = useState<ZenQuote | null>(null);

  useEffect(() => {
    async function getQuote() {
      try {
        const res = await fetch("/api/quote");
        if (res.ok) {
          const data = await res.json();
          setQuote(data);
        }
      } catch (error) {
        console.error("Failed to load quote", error);
      }
    }
    getQuote();
  }, []);

  if (!quote) return null;

  return (
    <footer
      className={cn(
        "fixed left-0 right-0 bottom-[58px] z-[60] border-t border-border/30 bg-background/95 backdrop-blur-lg transition-all lg:bottom-0",
        "shadow-[0_-2px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_-2px_20px_rgba(0,0,0,0.3)]"
      )}
    >
      <div className="container mx-auto px-3 py-2.5 lg:px-4 lg:py-3">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-center gap-2 md:justify-start">
            <Quote className="hidden h-3.5 w-3.5 fill-current text-primary/50 md:block" />
            <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary/90 whitespace-nowrap">
              {quote.category || "Inspiration"}
            </span>
          </div>
          <p className="mt-1 text-center text-sm font-medium italic leading-snug text-foreground/95 whitespace-normal break-words md:text-left md:text-base">
            &quot;{quote.q}&quot;
          </p>
          <p className="mt-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80 whitespace-normal break-words md:text-left md:text-xs">
            - {quote.a}
          </p>
        </div>
      </div>
    </footer>
  );
}
