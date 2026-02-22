
export type ZenQuote = {
    q: string; // Quote text
    a: string; // Author
    c?: string; // Character count (sometimes present)
    h?: string; // HTML format
    category?: string; // We will inject this
};

const TARGET_CATEGORIES = [
    "Anxiety", "Change", "Choice", "Confidence", "Courage", "Death", "Dreams",
    "Excellence", "Failure", "Fairness", "Fear", "Forgiveness", "Freedom",
    "Future", "Happiness", "Inspiration", "Kindness", "Leadership", "Life",
    "Living", "Love", "Pain", "Past", "Success", "Time", "Today", "Truth", "Work"
];

// Fallback if we can't match any category
const DEFAULT_CATEGORY = "Inspiration";

// In-memory circuit breaker to prevent repeated hangs if API is down
let lastFailureTime = 0;
const BREAKER_COOLDOWN = 600000; // 10 minutes

export async function fetchZenQuote(): Promise<ZenQuote> {
    const fallbackQuote: ZenQuote = {
        q: "The only way to do great work is to love what you do.",
        a: "Steve Jobs",
        category: "Work"
    };

    // If we're during build-time (static generation) or recently failed, don't block
    if (process.env.NEXT_PHASE === 'phase-production-build' || Date.now() - lastFailureTime < BREAKER_COOLDOWN) {
        return fallbackQuote;
    }

    let timeoutId: NodeJS.Timeout | undefined;
    try {
        const controller = new AbortController();
        // Use an even more aggressive timeout (2s) for cosmetic features
        timeoutId = setTimeout(() => controller.abort(), 2000);

        const res = await fetch("https://zenquotes.io/api/quotes", {
            next: { revalidate: 3600 }, // Cache for 1 hour
            signal: controller.signal
        });

        if (!res.ok) {
            throw new Error(`Status ${res.status}`);
        }

        const quotes: ZenQuote[] = await res.json();
        if (!Array.isArray(quotes) || quotes.length === 0) {
            throw new Error("Empty or invalid response");
        }

        clearTimeout(timeoutId);

        // Pick a random one from the batch
        const shuffled = [...quotes].sort(() => 0.5 - Math.random());

        for (const quote of shuffled) {
            const text = quote.q.toLowerCase();
            const matchedCategory = TARGET_CATEGORIES.find(cat =>
                text.includes(cat.toLowerCase())
            );

            if (matchedCategory) {
                return { ...quote, category: matchedCategory };
            }
        }

        return { ...shuffled[0], category: DEFAULT_CATEGORY };

    } catch (error: unknown) {
        lastFailureTime = Date.now();
        console.warn("ZenQuotes fetch failed, using fallback. Error:", (error as Error).message || error);
        return fallbackQuote;
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
}
