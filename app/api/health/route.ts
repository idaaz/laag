import { NextResponse } from "next/server";
import { getAdminClient, withRetry } from "@/lib/supabase/admin";

export async function GET() {
    const result: Record<string, unknown> = { ok: true };
    // Supabase check
    try {
        const start = Date.now();
        const supabase = getAdminClient();
        // lightweight check: simple query with limit 1
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await withRetry(() =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (supabase as any).from("vision_notes").select("id").limit(1),
            2, // Fewer retries for health check
            500 // Sorter delay
        );

        const duration = Date.now() - start;
        if (error) {
            const message = error instanceof Error ? error.message : String(error);
            result.supabase = { ok: false, error: message, duration };
            result.ok = false;
        } else {
            const rows = Array.isArray(data) ? data.length : 0;
            result.supabase = { ok: true, rows, duration };
        }
    } catch (e) {
        result.supabase = { ok: false, error: e instanceof Error ? e.message : String(e) };
        result.ok = false;
    }

    // ZenQuotes check
    try {
        const start = Date.now();
        // Use a shorter timeout for health check
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1000);

        const res = await fetch("https://zenquotes.io/api/quotes", {
            method: "HEAD",
            signal: controller.signal
        });
        clearTimeout(timeout);

        const duration = Date.now() - start;
        result.zenquotes = { ok: res.ok, status: res.status, duration };
        if (!res.ok) result.ok = false;
    } catch (e) {
        result.zenquotes = { ok: false, error: e instanceof Error ? e.message : String(e) };
        result.ok = false;
    }

    return NextResponse.json(result);
}
