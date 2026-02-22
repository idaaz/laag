
import { NextResponse } from "next/server";
import { fetchZenQuote } from "@/lib/services/zenquotes";

export const dynamic = 'force-dynamic'; // Ensure we don't cache too aggressively on Vercel edge

export async function GET() {
    try {
        const quote = await fetchZenQuote();
        return NextResponse.json(quote);
    } catch (e) {
        console.error("Critical error in /api/quote GET:", e);
        return NextResponse.json({
            q: "The only way to do great work is to love what you do.",
            a: "Steve Jobs",
            category: "Work"
        });
    }
}
