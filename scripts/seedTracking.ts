import { getSupabaseBrowserClient } from "../lib/supabase/client";

export async function seedTrackingData(userId: string) {
    const supabase = getSupabaseBrowserClient();

    const dummyUrls = [
        {
            user_id: userId,
            url: "https://github.com/trending",
            title: "Trending repositories on GitHub today",
            visited_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
        },
        {
            user_id: userId,
            url: "https://news.ycombinator.com/",
            title: "Hacker News",
            visited_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        },
        {
            user_id: userId,
            url: "https://react.dev/reference/react/useState",
            title: "useState – React",
            visited_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        }
    ];

    const { error } = await supabase.from("visited_urls").insert(dummyUrls as any);
    if (error) {
        console.error("Error seeding tracking data:", error);
    } else {
        console.log("Successfully seeded tracking data!");
    }
}
