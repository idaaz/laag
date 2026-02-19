
import { NextResponse } from "next/server";
import { fetchZenQuote } from "@/lib/services/zenquotes";

export const dynamic = 'force-dynamic'; // Ensure we don't cache too aggressively on Vercel edge

export async function GET() {
    const quote = await fetchZenQuote();
    return NextResponse.json(quote);
}
