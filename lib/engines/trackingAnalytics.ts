import type { VisitedUrlRow } from "@/lib/supabase/types";

export type DomainStats = {
    domain: string;
    count: number;
    percentage: number;
};

export type CategoryStats = {
    category: string;
    count: number;
    percentage: number;
    color: string;
};

export type TimePattern = {
    hour: number;
    count: number;
};

export type TrackingAnalytics = {
    topDomains: DomainStats[];
    categories: CategoryStats[];
    timePatterns: TimePattern[];
    focusScore: number;
    totalVisits: number;
    uniqueDomains: number;
};

// URL categorization patterns
const CATEGORY_PATTERNS: Record<string, { keywords: string[]; color: string }> = {
    Education: {
        keywords: ["udemy", "coursera", "edx", "khan", "stackoverflow", "github", "documentation", "docs", "tutorial", "learning"],
        color: "hsl(var(--chart-1))"
    },
    Work: {
        keywords: ["gmail", "outlook", "slack", "teams", "jira", "asana", "notion", "linear", "figma", "vercel"],
        color: "hsl(var(--chart-2))"
    },
    Social: {
        keywords: ["facebook", "twitter", "instagram", "reddit", "linkedin", "tiktok", "snapchat", "whatsapp"],
        color: "hsl(var(--chart-3))"
    },
    Entertainment: {
        keywords: ["youtube", "netflix", "spotify", "twitch", "gaming", "hulu", "prime", "disney"],
        color: "hsl(var(--chart-4))"
    },
    News: {
        keywords: ["news", "bbc", "cnn", "nytimes", "guardian", "reuters", "medium", "blog"],
        color: "hsl(var(--chart-5))"
    }
};

function extractDomain(url: string): string {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace("www.", "");
    } catch {
        return url;
    }
}

function categorizeUrl(url: string): string {
    const lowerUrl = url.toLowerCase();

    for (const [category, { keywords }] of Object.entries(CATEGORY_PATTERNS)) {
        if (keywords.some(keyword => lowerUrl.includes(keyword))) {
            return category;
        }
    }

    return "Other";
}

function getHourFromTimestamp(timestamp: string): number {
    return new Date(timestamp).getHours();
}

export function analyzeTrackingData(urls: VisitedUrlRow[]): TrackingAnalytics {
    if (urls.length === 0) {
        return {
            topDomains: [],
            categories: [],
            timePatterns: [],
            focusScore: 0,
            totalVisits: 0,
            uniqueDomains: 0
        };
    }

    // Domain analysis
    const domainCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();
    const hourCounts = new Map<number, number>();

    urls.forEach(entry => {
        const domain = extractDomain(entry.url);
        domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);

        const category = categorizeUrl(entry.url);
        categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);

        const hour = getHourFromTimestamp(entry.visited_at);
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    // Top domains
    const topDomains = Array.from(domainCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([domain, count]) => ({
            domain,
            count,
            percentage: (count / urls.length) * 100
        }));

    // Categories
    const categories = Array.from(categoryCounts.entries())
        .map(([category, count]) => ({
            category,
            count,
            percentage: (count / urls.length) * 100,
            color: CATEGORY_PATTERNS[category]?.color || "hsl(var(--muted))"
        }))
        .sort((a, b) => b.count - a.count);

    // Time patterns (all 24 hours)
    const timePatterns = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: hourCounts.get(hour) || 0
    }));

    // Focus score (Education + Work vs Entertainment + Social)
    const productiveCount = (categoryCounts.get("Education") || 0) + (categoryCounts.get("Work") || 0);
    const distractingCount = (categoryCounts.get("Entertainment") || 0) + (categoryCounts.get("Social") || 0);
    const focusScore = urls.length > 0
        ? Math.round((productiveCount / (productiveCount + distractingCount || 1)) * 100)
        : 0;

    return {
        topDomains,
        categories,
        timePatterns,
        focusScore: Math.min(100, Math.max(0, focusScore)),
        totalVisits: urls.length,
        uniqueDomains: domainCounts.size
    };
}
