"use client";

import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { pushToast } from "@/components/ui/toast";
import type {
  VisionHorizon,
  VisionNoteRow,
  VisionNoteType,
  VisionPillar
} from "@/lib/supabase/types";

export const VISION_NOTES_QUERY_KEY = "vision-notes";

export type VisionNoteDraft = {
  title: string;
  body: string;
  note_type: VisionNoteType;
  vision_pillar: VisionPillar;
  pinned: boolean;
};

export type VisionNoteUpdate = Partial<Omit<VisionNoteDraft, "tags">> & {
  tags?: string[];
  archived?: boolean;
  archived_at?: string | null;
};

export type VisionNoteFilters = {
  viewTab: "board" | "pinned" | "archive";
  type?: VisionNoteType | "all";
  pillar?: VisionPillar | "all";
  search?: string;
};

export function useVisionNotes(userId?: string, filters: VisionNoteFilters = { viewTab: "board" }) {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();
  const limit = 20;

  const queryKey = [VISION_NOTES_QUERY_KEY, userId, filters] as const;

  const notesQuery = useInfiniteQuery<VisionNoteRow[], Error, InfiniteData<VisionNoteRow[]>, typeof queryKey, number>({
    queryKey,
    enabled: !!userId,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const nextIndex = lastPage.length === limit ? allPages.length * limit : undefined;
      return nextIndex;
    },
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) throw new Error("Missing user");

      let query = supabase
        .from("vision_notes")
        .select("*");

      // Apply View Filters
      if (filters.viewTab === "archive") {
        query = query.eq("archived", true);
      } else {
        query = query.eq("archived", false);
      }

      if (filters.viewTab === "pinned") {
        // For pinned tab, show only pinned notes
        query = query.eq("pinned", true);
      }

      // Apply Attribute Filters
      if (filters.type && filters.type !== "all") {
        query = query.eq("note_type", filters.type);
      }
      if (filters.pillar && filters.pillar !== "all") {
        query = query.eq("vision_pillar", filters.pillar);
      }

      // Apply Search (Basic text search on title/body)
      if (filters.search && filters.search.trim()) {
        const searchTerm = `%${filters.search.trim()}%`;
        query = query.or(`title.ilike.${searchTerm},body.ilike.${searchTerm}`);
      }

      // Apply Sorting & Pagination
      // Default sort: Pinned first, then Updated At desc
      query = query.order("pinned", { ascending: false, nullsFirst: false });
      query = query.order("updated_at", { ascending: false });

      // Enforce user_id last to be safe (RLS handles it but good practice)
      query = query.eq("user_id", userId);

      // Pagination
      query = query.range(pageParam, pageParam + limit - 1);

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return (data ?? []) as VisionNoteRow[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (draft: VisionNoteDraft) => {
      if (!userId) throw new Error("Missing user");
      const { data, error } = await (supabase.from("vision_notes") as any)
        .insert({
          user_id: userId,
          title: draft.title,
          body: draft.body,
          note_type: draft.note_type,
          vision_pillar: draft.vision_pillar,
          horizon: "today",
          impact_score: 1,
          effort_score: 1,
          tags: [],
          pinned: draft.pinned,
          archived: false,
          archived_at: null,
          review_date: null
        })
        .select("*")
        .single();
      if (error) {
        console.error("Supabase Insert Error:", error);
        pushToast("Error", "Failed to save note: " + error.message);
        throw new Error(error.message);
      }
      return data as VisionNoteRow;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey });

      // Trigger notifications for significant note types
      if (userId && (data.note_type === "milestone" || data.note_type === "insight")) {
        import("@/lib/engines/notificationEngine").then(({ createNotification, notifyVisionMilestone }) => {
          if (data.note_type === "milestone") {
            notifyVisionMilestone(userId, data.title).catch(console.error);
          } else {
            createNotification({
              userId,
              type: "insight",
              title: "New Insight Captured! ✨",
              message: `You've recorded a new insight: ${data.title}. Use this to drive your product and growth.`,
              data: { note: data.title }
            }).catch(console.error);
          }
        });
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: VisionNoteUpdate }) => {
      const { data, error } = await (supabase.from("vision_notes") as any)
        .update(changes)
        .eq("id", id)
        .select("*")
        .single();
      if (error) {
        console.error("Supabase Update Error:", error);
        pushToast("Error", "Failed to update note: " + error.message);
        throw new Error(error.message);
      }
      return data as VisionNoteRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vision_notes").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  async function createNote(draft: VisionNoteDraft) {
    return createMutation.mutateAsync(draft);
  }

  async function updateNote(id: string, changes: VisionNoteUpdate) {
    return updateMutation.mutateAsync({ id, changes });
  }

  async function deleteNote(id: string) {
    return deleteMutation.mutateAsync(id);
  }

  async function togglePin(note: VisionNoteRow) {
    return updateMutation.mutateAsync({
      id: note.id,
      changes: { pinned: !note.pinned }
    });
  }

  async function toggleArchive(note: VisionNoteRow) {
    const nextArchived = !note.archived;
    return updateMutation.mutateAsync({
      id: note.id,
      changes: {
        archived: nextArchived,
        archived_at: nextArchived ? new Date().toISOString() : null
      }
    });
  }

  return {
    notesQuery,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    toggleArchive,
    pending: {
      creating: createMutation.isPending,
      updating: updateMutation.isPending,
      deleting: deleteMutation.isPending
    }
  };
}
