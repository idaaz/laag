import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pushToast } from "@/components/ui/toast";
import type { VisionNoteRow } from "@/lib/supabase/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// We create simple typescript types here to use in the hook
export type CreateNotePayload = {
    title: string;
    body?: string;
    note_type?: string;
    horizon?: string;
    impact_score?: number;
    effort_score?: number;
    tags?: string[];
    pinned?: boolean;
    review_date?: string | null;
    attachments?: Record<string, unknown>[];
};

export type UpdateNotePayload = Partial<CreateNotePayload> & {
    archived?: boolean;
};

export function useNotes(userId: string | undefined, opts?: { archived?: boolean; limit?: number }) {
    const supabase = getSupabaseBrowserClient();
    const queryClient = useQueryClient();
    const isArchived = opts?.archived ?? false;
    const limit = opts?.limit ?? 50;

    // Core Query Key
    const queryKey = ["notes", userId, { archived: isArchived, limit }];

    // Fetch notes
    const { data: notes, isLoading, error } = useQuery<VisionNoteRow[]>({
        queryKey,
        queryFn: async () => {
            if (!userId) return [];

            const { data, error } = await supabase
                .from("vision_notes")
                .select("*")
                .eq("user_id", userId)
                .eq("archived", isArchived)
                .order("pinned", { ascending: false })
                .order("updated_at", { ascending: false })
                .limit(limit);

            if (error) throw error;
            return (data ?? []) as VisionNoteRow[];
        },
        enabled: !!userId,
    });

    // Create Mutation
    const createNote = useMutation({
        mutationFn: async (payload: CreateNotePayload) => {
            if (!userId) throw new Error("Missing user");
            const { data, error } = await supabase
                .from("vision_notes")
                .insert({
                    user_id: userId,
                    ...payload
                } as never)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data: VisionNoteRow) => {
            queryClient.invalidateQueries({ queryKey: ["notes", userId] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-metrics", userId] });
            pushToast("Note Created", `"${data.title}" saved to vision.`);
        }
    });

    const updateNote = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: UpdateNotePayload }) => {
            if (!userId) throw new Error("Missing user ID");

            console.log("updateNote mutation payload:", { id, userId, payload });

            // Explicitly prevent updating system fields
            const { id: _, user_id: __, created_at: ___, updated_at: ____, ...cleanPayload } = payload as Record<string, unknown>;

            // Filter out undefined values
            const updatePayload = Object.fromEntries(
                Object.entries(cleanPayload).filter(([_, v]) => v !== undefined)
            );

            const { data, error } = await supabase
                .from("vision_notes")
                .update(updatePayload as never)
                .eq("id", id)
                .eq("user_id", userId)
                .select()
                .single();

            if (error) {
                console.error("Supabase update error:", error);
                throw error;
            }
            return data;
        },
        onSuccess: (data: VisionNoteRow) => {
            queryClient.invalidateQueries({ queryKey: ["notes", userId] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-metrics", userId] });
            pushToast("Note Updated", `"${data.title}" has been updated.`);
        }
    });

    // Delete Mutation
    const deleteNote = useMutation({
        mutationFn: async (id: string) => {
            // Archive to GitHub before deleting
            const { data: noteToArchive } = await supabase.from("vision_notes").select("*").eq("id", id).single();
            if (noteToArchive) {
                try {
                    await fetch("/api/archive", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            type: "notes",
                            subfolder: "deleted",
                            filename: `note_${id}_${Date.now()}`,
                            payload: noteToArchive
                        })
                    });
                } catch (e) {
                    console.error("Failed to archive note before deletion", e);
                }
            }

            const { error } = await supabase
                .from("vision_notes")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notes", userId] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-metrics", userId] });
            pushToast("Note Deleted", "The note has been removed.");
        }
    });

    return {
        notes: notes || [],
        isLoading,
        error,
        createNote: createNote.mutate,
        createNoteAsync: createNote.mutateAsync,
        updateNote: updateNote.mutate,
        updateNoteAsync: updateNote.mutateAsync,
        deleteNote: deleteNote.mutate,
        deleteNoteAsync: deleteNote.mutateAsync,
        isCreating: createNote.isPending,
        isUpdating: updateNote.isPending,
        isDeleting: deleteNote.isPending
    };
}
