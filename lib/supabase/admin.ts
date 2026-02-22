import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase admin client using the service role key.
 * Used for server-side operations that need to bypass RLS or don't have a user session.
 */
export function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error("Missing Supabase server-side environment variables (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).");
    }

    // Increased timeout and better fetch options for stability
    return createClient(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

/**
 * Generic retry wrapper for database operations
 */
export async function withRetry<T>(
    operation: () => Promise<{ data: T | null; error: unknown }>,
    maxRetries = 3,
    initialDelay = 1000
): Promise<{ data: T | null; error: unknown }> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const result = await operation();

            // If it succeeded or failed with a non-network error, return
            if (!result.error) return result;

            lastError = result.error;

            // If it's a specific network error or timeout, retry
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errorStr = String((lastError as any)?.message || lastError).toLowerCase();
            const isRetryable =
                errorStr.includes("fetch failed") ||
                errorStr.includes("timeout") ||
                errorStr.includes("network error") ||
                errorStr.includes("abort");

            if (!isRetryable) return result;

        } catch (err) {
            lastError = err;
            const errorStr = String(err).toLowerCase();
            if (!errorStr.includes("fetch failed") && !errorStr.includes("timeout")) {
                throw err;
            }
        }

        if (attempt < maxRetries) {
            const delay = initialDelay * Math.pow(2, attempt);
            console.log(`Supabase operation failed (Attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`, lastError);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    return { data: null, error: lastError };
}
