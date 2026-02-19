/**
 * Formats a duration in minutes into a human-readable string.
 * - < 1 min: "X sec"
 * - >= 60 min: "X hr Y min"
 * - Else: "X min"
 */
export function formatCountingTimer(minutes: number): string {
    if (minutes < 1) {
        const seconds = Math.round(minutes * 60);
        return `${seconds} sec`;
    }

    if (minutes >= 60) {
        const hrs = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        if (mins === 0) return `${hrs} hr`;
        return `${hrs} hr ${mins} min`;
    }

    return `${Math.round(minutes)} min`;
}

/**
 * Parses a natural language time string into minutes.
 * Supports:
 * - "1.5" or "1" (assumed minutes)
 * - "10 sec"
 * - "1 hr 15 min"
 * - "1h 15m"
 * - "1:15"
 */
export function parseCountingTimer(value: string): number {
    const v = value.toLowerCase().trim();
    if (!v) return 0;

    // Pattern: "1 hr 15 min" or "1h 15m"
    const hrMinPattern = /(\d+)\s*(?:hr|h)\s*(?:(\d+)\s*(?:min|m))?/;
    const hrMinMatch = v.match(hrMinPattern);
    if (hrMinMatch) {
        const hrs = parseInt(hrMinMatch[1], 10) || 0;
        const mins = parseInt(hrMinMatch[2], 10) || 0;
        return hrs * 60 + mins;
    }

    // Pattern: "10 sec" or "10s"
    const secPattern = /(\d+(?:\.\d+)?)\s*(?:sec|s)/;
    const secMatch = v.match(secPattern);
    if (secMatch) {
        return (parseFloat(secMatch[1]) || 0) / 60;
    }

    // Pattern: "15 min" or "15m"
    const minPattern = /(\d+(?:\.\d+)?)\s*(?:min|m)/;
    const minMatch = v.match(minPattern);
    if (minMatch) {
        return parseFloat(minMatch[1]) || 0;
    }

    // Pattern: "1:15"
    if (v.includes(':')) {
        const [h, m] = v.split(':').map(p => parseInt(p, 10) || 0);
        return h * 60 + m;
    }

    // fallback to simple float parse (assumed minutes)
    return parseFloat(v) || 0;
}
