"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { VisitedUrlRow, TrackingCategoryRow, TrackingCustomRuleRow } from "@/lib/supabase/types";

export type TrackingAnalytics = {
    focusScore: number;
    totalVisits: number;
    uniqueDomains: number;
    productiveCount: number;
    distractingCount: number;
    peakHour?: number;
    topDomain?: string;
    totalWatchTime: number;
    contextSwitches: number;
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
const TRACKING_CUSTOM_RULES_KEY = ["tracking_custom_rules"];

export function useTracking(
    userId?: string,
    page = 1,
    limit = 10,
    analyticsLimit = 10,
    filters?: { urlPrefix?: string; search?: string; startHour?: number; endHour?: number }
) {
    const supabase = getSupabaseBrowserClient();
    const queryClient = useQueryClient();

    const visitedUrlsQuery = useQuery({
        queryKey: [...TRACKING_QUERY_KEY, userId, page, limit, filters?.urlPrefix],
        enabled: !!userId,
        queryFn: async () => {
            if (!userId) throw new Error("Missing user");

            let query = supabase
                .from("visited_urls")
                .select("*")
                .eq("user_id", userId)
                .order("visited_at", { ascending: false });

            // Apply URL prefix filter at DB level for accurate pagination
            if (filters?.urlPrefix) {
                query = query.ilike("url", `${filters.urlPrefix}%`);
            }

            // Note: We could also apply search and time filters here via Supabase query
            // for the URL list, but currently they are filtered client-side in the page.
            // Keeping it consistent with current UI logic but prioritizing custom rules.

            const { data: supabaseData, error } = await query;

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
        queryKey: ["tracking_analytics", userId, analyticsLimit, filters],
        enabled: !!userId,
        queryFn: async () => {
            if (!userId) throw new Error("Missing user");

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data, error } = await supabase.rpc("get_tracking_analytics", {
                p_user_id: userId,
                p_start_date: thirtyDaysAgo.toISOString(),
                p_limit: analyticsLimit,
                p_search: filters?.search || null,
                p_url_prefix: filters?.urlPrefix || null,
                p_start_hour: filters?.startHour ?? 0,
                p_end_hour: filters?.endHour ?? 24
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

    // Custom Rules Query — uses API route to bypass RLS (app uses mock auth, no real JWT)
    const customRulesQuery = useQuery({
        queryKey: [...TRACKING_CUSTOM_RULES_KEY, userId],
        enabled: !!userId,
        queryFn: async () => {
            const res = await fetch("/api/tracking/custom-rules");
            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                throw new Error(json.error || `Failed to fetch custom rules (${res.status})`);
            }
            const json = await res.json();
            return (json.data ?? []) as TrackingCustomRuleRow[];
        }
    });

    const createCustomRule = useMutation({
        mutationFn: async ({ urlPrefix, name }: { urlPrefix: string; name: string }) => {
            const res = await fetch("/api/tracking/custom-rules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url_prefix: urlPrefix, name })
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || `Failed to create rule (${res.status})`);
            return json.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TRACKING_CUSTOM_RULES_KEY });
        }
    });

    const deleteCustomRule = useMutation({
        mutationFn: async (ruleId: string) => {
            const res = await fetch(`/api/tracking/custom-rules?id=${encodeURIComponent(ruleId)}`, {
                method: "DELETE"
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || `Failed to delete rule (${res.status})`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TRACKING_CUSTOM_RULES_KEY });
        }
    });

    return {
        visitedUrlsQuery,
        analyticsQuery,
        categoriesQuery,
        createCategory,
        assignDomain,
        logInAppVisit,
        customRulesQuery,
        createCustomRule,
        deleteCustomRule
    };
}

