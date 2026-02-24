/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { checkAndUnlockAchievements } from "@/lib/engines/achievementEngine";

const MOCK_USER_ID = "27161a3b-9776-4484-b614-6ca6c18f2403";

export async function GET(req: NextRequest) {
    try {
        const userId = req.nextUrl.searchParams.get("userId") || MOCK_USER_ID;
        const supabase = getAdminClient();

        const [definitions, unlockedData, progress] = await Promise.all([
            supabase.from("achievement_definitions").select("*").order("display_order"),
            supabase.from("achievements").select("*").eq("user_id", userId),
            supabase.from("achievement_progress").select("*").eq("user_id", userId)
        ]);

        if (definitions.error) throw definitions.error;
        if (unlockedData.error) throw unlockedData.error;
        if (progress.error) throw progress.error;

        return NextResponse.json({
            definitions: definitions.data,
            unlocked: unlockedData.data,
            progress: progress.data
        });
    } catch (error) {
        console.error("Achievements GET API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId, action, metric, amount } = await req.json();
        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        const supabase = getAdminClient();

        if (action === "increment" && metric) {
            const { incrementAchievementProgress } = await import("@/lib/engines/achievementEngine");
            await incrementAchievementProgress(supabase, userId, metric, amount || 1);
            return NextResponse.json({ success: true });
        }

        const newlyUnlocked = await checkAndUnlockAchievements(supabase, userId);
        return NextResponse.json({ newlyUnlocked });
    } catch (error: any) {
        console.error("Achievements POST API Error:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            message: error?.message || String(error)
        }, { status: 500 });
    }
}
