
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

export async function fetchZenQuote(): Promise<ZenQuote> {
    try {
        // Fetch a batch of 50 quotes to increase chances of finding relevant ones
        const res = await fetch("https://zenquotes.io/api/quotes", {
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch quotes: ${res.status}`);
        }

        const quotes: ZenQuote[] = await res.json();

        // Shuffle the quotes to get variety from the batch
        const shuffled = quotes.sort(() => 0.5 - Math.random());

        // Try to find a quote that matches our target categories
        for (const quote of shuffled) {
            const text = quote.q.toLowerCase();
            // rigorous matching might be too strict, let's try simple inclusion
            // check if any category keyword appears in the quote text
            const matchedCategory = TARGET_CATEGORIES.find(cat =>
                text.includes(cat.toLowerCase())
            );

            if (matchedCategory) {
                return { ...quote, category: matchedCategory };
            }
        }

        // If no match found in the batch, return the first one with default category
        // or try to infer a category basically
        const fallback = shuffled[0];
        return { ...fallback, category: DEFAULT_CATEGORY };

    } catch (error) {
        console.error("Error fetching ZenQuote:", error);
        return {
            q: "The only way to do great work is to love what you do.",
            a: "Steve Jobs",
            category: "Work"
        };
    }
}
