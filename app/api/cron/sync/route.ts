import { NextResponse } from "next/server";
import { archiveToGitHub } from "@/lib/github/archive";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// We need a Service Role key to bypass RLS and operate on all users' data via cron
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

type TableName = keyof Database["public"]["Tables"];

// Helper to group by user and archive
async function processArchiveBatch(
    data: Record<string, unknown>[],
    type: string,
    tableName: TableName
) {
    if (!data || data.length === 0) return;

    const byUser: Record<string, Record<string, unknown>[]> = {};
    for (const item of data) {
        const uid = item.user_id as string;
        if (uid) {
            if (!byUser[uid]) byUser[uid] = [];
            byUser[uid].push(item);
        }
    }

    const yearMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    for (const userId of Object.keys(byUser)) {
        const items = byUser[userId];
        const filename = `${type}_sync_${Date.now()}`;

        // Use subfolders for better organization
        const success = await archiveToGitHub(userId, type, filename, items, yearMonth);

        if (success) {
            const ids = items.map((i) => i.id as string);
            const { error: deleteError } = await supabase
                .from(tableName)
                .delete()
                .in("id", ids);

            if (deleteError) {
                console.error(`Failed to delete archived ${tableName} for user ${userId}:`, deleteError);
            }
        } else {
            console.error(`Failed to archive ${type} to GitHub for user ${userId}`);
        }
    }
}

export async function GET() {
    try {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        console.log(`Starting cron sync for data older than ${cutoff}`);

        // 1. Visited URLs
        const { data: urls } = await supabase.from("visited_urls").select("*").lt("visited_at", cutoff);
        await processArchiveBatch(urls || [], "tracking", "visited_urls");

        // 2. Daily Logs
        const { data: logs } = await supabase.from("daily_logs").select("*").lt("created_at", cutoff);
        await processArchiveBatch(logs || [], "daily_logs", "daily_logs");

        // 3. Habit Answers
        const { data: answers } = await supabase.from("habit_completion_answers").select("*").lt("created_at", cutoff);
        await processArchiveBatch(answers || [], "habits/answers", "habit_completion_answers");

        // 4. Completed Tasks
        const { data: completedTasks } = await supabase.from("tasks")
            .select("*")
            .eq("status", "completed")
            .lt("updated_at", cutoff);
        await processArchiveBatch(completedTasks || [], "tasks", "tasks");

        // 5. Archived Habits (inactive)
        const { data: archivedHabits } = await supabase.from("habits")
            .select("*")
            .eq("is_active", false)
            .lt("updated_at", cutoff);
        await processArchiveBatch(archivedHabits || [], "habits", "habits");

        // 6. Archived Vision Notes
        const { data: archivedNotes } = await supabase.from("vision_notes")
            .select("*")
            .eq("archived", true)
            .lt("updated_at", cutoff);
        await processArchiveBatch(archivedNotes || [], "notes", "vision_notes");

        // 7. XP Events
        const { data: xp } = await supabase.from("xp_events").select("*").lt("created_at", cutoff);
        await processArchiveBatch(xp || [], "xp", "xp_events");

        return NextResponse.json({ success: true, message: "Sync complete" });
    } catch (error) {
        console.error("Cron sync error:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
