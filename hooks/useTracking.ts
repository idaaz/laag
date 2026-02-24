"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { VisitedUrlRow, TrackingCategoryRow } from "@/lib/supabase/types";

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
const TRACKING_CATEGORIES_KEY = ["tracking_categories"];

export function useTracking(userId?: string, page = 1, limit = 10, analyticsLimit = 10) {
    const supabase = getSupabaseBrowserClient();
    const queryClient = useQueryClient();

    const visitedUrlsQuery = useQuery({
        queryKey: [...TRACKING_QUERY_KEY, userId, page, limit],
        enabled: !!userId,
        queryFn: async () => {
            if (!userId) throw new Error("Missing user");

            const { data: supabaseData, error } = await supabase
                .from("visited_urls")
                .select("*")
                .eq("user_id", userId)
                .order("visited_at", { ascending: false });

            if (error) throw new Error(error.message);

            // Fetch GitHub archived data
            let githubData: VisitedUrlRow[] = [];
            try {
                const res = await fetch(`/api/archive?type=tracking`);
                if (res.ok) {
                    const json = await res.json();
                    if (json.data) {
                        githubData = json.data.flat();
                    }
                }
            } catch (e) {
                console.error("Failed to fetch archived tracking", e);
            }

            // Merge and sort
            const mergedData = [...(supabaseData || []), ...githubData].sort(
                (a, b) => new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime()
            );

            // Paginate locally
            const from = (page - 1) * limit;
            const to = from + limit;
            const paginatedData = mergedData.slice(from, to);

            return {
                data: paginatedData as VisitedUrlRow[],
                count: mergedData.length
            };
        }
    });

    // Analytics query using Server-Side RPC
    const analyticsQuery = useQuery({
        queryKey: ["tracking_analytics", userId, analyticsLimit],
        enabled: !!userId,
        queryFn: async () => {
            if (!userId) throw new Error("Missing user");

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data, error } = await supabase.rpc("get_tracking_analytics", {
                p_user_id: userId,
                p_start_date: thirtyDaysAgo.toISOString(),
                p_limit: analyticsLimit
            } as any);

            if (error) throw new Error(error.message);

            return data as TrackingAnalytics;
        }
    });

    // Categories Query
    const categoriesQuery = useQuery({
        queryKey: [...TRACKING_CATEGORIES_KEY, userId],
        enabled: !!userId,
        queryFn: async () => {
            if (!userId) throw new Error("Missing user");
            const { data, error } = await supabase
                .from("tracking_categories")
                .select("*")
                .eq("user_id", userId)
                .order("name");

            if (error) throw new Error(error.message);
            return (data ?? []) as TrackingCategoryRow[];
        }
    });

    const createCategory = useMutation({
        mutationFn: async ({ name, color }: { name: string; color: string }) => {
            if (!userId) throw new Error("Missing user");
            const { data, error } = await supabase
                .from("tracking_categories")
                .insert([{ user_id: userId, name, color }] as any)
                .select();
            if (error) throw new Error(error.message);
            return data[0];
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TRACKING_CATEGORIES_KEY });
            queryClient.invalidateQueries({ queryKey: ["tracking_analytics", userId] });
        }
    });

    const assignDomain = useMutation({
        mutationFn: async ({ domain, categoryId }: { domain: string; categoryId: string }) => {
            if (!userId) throw new Error("Missing user");

            // Upsert strategy using the unique constraint (user_id, domain)
            const { data, error } = await supabase
                .from("tracking_domain_categories")
                .upsert(
                    { user_id: userId, domain, category_id: categoryId } as any,
                    { onConflict: 'user_id, domain' }
                )
                .select();
            if (error) throw new Error(error.message);
            return data[0];
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tracking_analytics", userId] });
        }
    });

    const logInAppVisit = useMutation({
        mutationFn: async ({ url, title }: { url: string; title: string }) => {
            if (!userId) throw new Error("Missing user");
            const { error } = await supabase
                .from("visited_urls")
                .insert([{
                    user_id: userId,
                    url,
                    title: title || "In-App Preview",
                    is_in_app: true
                }] as any);

            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TRACKING_QUERY_KEY });
        }
    });

    return {
        visitedUrlsQuery,
        analyticsQuery,
        categoriesQuery,
        createCategory,
        assignDomain,
        logInAppVisit
    };
}

