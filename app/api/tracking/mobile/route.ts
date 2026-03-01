import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const supabase = await getSupabaseServerClient();
        const {
            userId,
            url,
            title,
            watchTime,
            videoStart,
            videoEnd,
            totalDuration,
            channelName,
            youtubeCategory,
            recordId // If provided, update existing
        } = await req.json();

        if (!userId || !url) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (recordId) {
            // Update existing record (Heartbeat)
            const { error: updateError } = await supabase
                .from("visited_urls")
                // @ts-expect-error - Supabase type inference for specific tables can be finicky in certain server contexts
                .update({
                    watch_time_seconds: watchTime,
                    video_end_time: videoEnd,
                    total_duration_seconds: totalDuration,
                })
                .eq("id", recordId)
                .eq("user_id", userId);

            if (updateError) throw updateError;
            return NextResponse.json({ success: true });
        } else {
            // Create new record
            const { data, error: insertError } = await supabase
                .from("visited_urls")
                // @ts-expect-error - Supabase type inference for specific tables can be finicky in certain server contexts
                .insert({
                    user_id: userId,
                    url,
                    title,
                    watch_time_seconds: watchTime || 0,
                    video_start_time: videoStart || 0,
                    video_end_time: videoEnd || 0,
                    total_duration_seconds: totalDuration,
                    channel_name: channelName,
                    youtube_category: youtubeCategory,
                    is_in_app: true,
                    visited_at: new Date().toISOString()
                })
                .select("id")
                .single();

            if (insertError) throw insertError;
            const recordIdResult = data as unknown as { id: string };
            return NextResponse.json({ success: true, recordId: recordIdResult.id });
        }
    } catch (error: unknown) {
        console.error("Mobile Tracking API Error:", error);
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// Fetch YouTube Metadata (Server-side to avoid CORS)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const videoUrl = searchParams.get("url");

    if (!videoUrl) {
        return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    try {
        // Fetch the YouTube page server-side
        const response = await fetch(videoUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
        const html = await response.text();

        // Basic Regex extraction for metadata
        const titleMatch = html.match(/<title>(.*?)<\/title>/);
        const categoryMatch = html.match(/"category":"(.*?)"/);
        const channelMatch = html.match(/"ownerChannelName":"(.*?)"/);
        const durationMatch = html.match(/"lengthSeconds":"(\d+)"/);

        // Try getting category from genre meta tag if the above fails
        const genreMatch = html.match(/<meta itemprop="genre" content="(.*?)"/);

        return NextResponse.json({
            title: titleMatch ? titleMatch[1].replace(" - YouTube", "") : "Unknown Video",
            category: categoryMatch ? categoryMatch[1] : (genreMatch ? genreMatch[1] : "YouTube Video"),
            channel: channelMatch ? channelMatch[1] : "Unknown Channel",
            duration: durationMatch ? parseInt(durationMatch[1]) : 0
        });
    } catch (error: unknown) {
        console.error("YouTube Metadata Fetch Error:", error);
        return NextResponse.json({ error: "Failed to fetch metadata" }, { status: 500 });
    }
}
