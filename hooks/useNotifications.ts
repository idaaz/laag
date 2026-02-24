"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AppNotificationRow } from "@/lib/supabase/types";

const NOTIFICATIONS_QUERY_KEY = ["app_notifications"];

export function useNotifications(userId?: string) {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) throw new Error("Missing user");

      const { data, error } = await supabase
        .from("app_notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as AppNotificationRow[];
    }
  });

  const unreadCount = notificationsQuery.data?.filter(n => !n.is_read).length ?? 0;

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("app_notifications")
        .update({ is_read: true } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_QUERY_KEY, userId] });
    }
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const { error } = await supabase
        .from("app_notifications")
        .update({ is_read: true } as never)
        .eq("user_id", userId)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_QUERY_KEY, userId] });
    }
  });

  return {
    notifications: notificationsQuery.data ?? [],
    isLoading: notificationsQuery.isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
}
