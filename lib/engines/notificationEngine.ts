import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type NotificationInput = {
    userId: string;
    type: "achievement" | "milestone" | "insight" | "vision" | "task" | "habit";
    title: string;
    message: string;
    data?: Record<string, unknown>;
};

/**
 * Creates a notification in the app_notifications table
 */
export async function createNotification(input: NotificationInput) {
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase.from("app_notifications").insert({
        user_id: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data || {},
        is_read: false
    } as never);

    if (error) {
        console.error("Failed to create notification:", error);
        return false;
    }

    return true;
}

/**
 * Convenience method for achievement notifications
 */
export async function notifyAchievementUnlocked(userId: string, achievementTitle: string, tier?: string) {
    return createNotification({
        userId,
        type: "achievement",
        title: "Achievement Unlocked! 🏆",
        message: `You've earned: ${achievementTitle}${tier ? ` (${tier})` : ""}. Keep it up!`,
        data: { achievement: achievementTitle, tier }
    });
}

/**
 * Convenience method for vision milestones
 */
export async function notifyVisionMilestone(userId: string, noteTitle: string) {
    return createNotification({
        userId,
        type: "milestone",
        title: "Vision Milestone Reached! 🚀",
        message: `You've reached a significant milestone: ${noteTitle}. Focus on the next horizon.`,
        data: { note: noteTitle }
    });
}
