"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Subscribes to changes on specific Supabase tables and invalidates
 * the provided React Query keys when changes occur.
 *
 * @param tables Array of table names to listen to.
 * @param queryKeys Array of query keys to invalidate on change.
 * @param event Filter for specific events ("INSERT", "UPDATE", "DELETE", or "*"). Defaults to "*".
 */
export function useRealtime(
    tables: string[],
    queryKeys: string[][],
    event: "INSERT" | "UPDATE" | "DELETE" | "*" = "*"
) {
    const queryClient = useQueryClient();
    const supabase = getSupabaseBrowserClient();

    useEffect(() => {
        if (!tables.length) return;

        // Create a unique channel name based on tables
        const channelName = `realtime-${tables.join("-")}`;
        const channel = supabase.channel(channelName);

        tables.forEach((table) => {
            channel.on(
                "postgres_changes",
                {
                    event,
                    schema: "public",
                    table
                },
                () => {
                    // Invalidate all provided query keys
                    queryKeys.forEach((key) => {
                        queryClient.invalidateQueries({ queryKey: key });
                    });
                }
            );
        });

        channel.subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        // Stable dependencies based on value content
        // eslint-disable-next-line react-hooks/exhaustive-deps
        JSON.stringify(tables),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        JSON.stringify(queryKeys),
        event,
        queryClient,
        supabase
    ]);
}
