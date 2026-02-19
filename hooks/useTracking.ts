"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { VisitedUrlRow } from "@/lib/supabase/types";

export type TrackingAnalytics = {
    focusScore: number;
    totalVisits: number;
    uniqueDomains: number;
    categories: Array<{
        category: string;
        count: number;
        percentage: number;
        color: string;
    }>;
    topDomains: Array<{
        domain: string;
        count: number;
        percentage: number;
    }>;
};

const TRACKING_QUERY_KEY = ["visited_urls"];

export function useTracking(userId?: string, page = 1, limit = 10) {
    const supabase = getSupabaseBrowserClient();

    const visitedUrlsQuery = useQuery({
        queryKey: [...TRACKING_QUERY_KEY, userId, page, limit],
        enabled: !!userId,
        queryFn: async () => {
            if (!userId) throw new Error("Missing user");

            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { data, error, count } = await supabase
                .from("visited_urls")
                .select("*", { count: "exact" })
                .eq("user_id", userId)
                .order("visited_at", { ascending: false })
                .range(from, to);

            if (error) throw new Error(error.message);

            return {
                data: (data ?? []) as VisitedUrlRow[],
                count: count ?? 0
            };
        }
    });

    // Analytics query using Server-Side RPC
    const analyticsQuery = useQuery({
        queryKey: ["tracking_analytics", userId],
        enabled: !!userId,
        queryFn: async () => {
            if (!userId) throw new Error("Missing user");

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data, error } = await supabase.rpc("get_tracking_analytics", {
                p_user_id: userId,
                p_start_date: thirtyDaysAgo.toISOString()
            } as any);

            if (error) throw new Error(error.message);

            // The RPC returns JSONB, so we cast it to our expected shape
            return data as TrackingAnalytics;
        }
    });

    return { visitedUrlsQuery, analyticsQuery };
}

