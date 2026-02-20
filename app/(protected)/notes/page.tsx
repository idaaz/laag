"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Pin, Search } from "lucide-react";
import { PageFrame } from "@/components/structure/PageFrame";
import { SectionHeader } from "@/components/structure/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { NoteFormDialog } from "@/components/notes/NoteFormDialog";
import { useAuth } from "@/hooks/useAuth";
import { useVisionNotes, type VisionNoteFilters, type VisionNoteDraft } from "@/hooks/useVisionNotes";
import type { VisionNoteRow } from "@/lib/supabase/types";
import { format } from "date-fns";

export default function NotesPage() {
    const { user } = useAuth();
    const userId = user?.id;
    const searchParams = useSearchParams();
    const router = useRouter();

    const [formOpen, setFormOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<VisionNoteRow | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const filters = useMemo<VisionNoteFilters>(() => ({
        viewTab: "board",
        search: searchTerm
    }), [searchTerm]);

    const { notesQuery, createNote, updateNote, pending } = useVisionNotes(userId, filters);

    // Sync searchTerm with URL for in-tab search
    useEffect(() => {
        const q = searchParams.get("q") || "";
        setSearchTerm(q);
    }, [searchParams]);

    // Handle ?action=new
    useEffect(() => {
        if (searchParams.get("action") === "new") {
            setEditingNote(null);
            setFormOpen(true);
            // Clean up action without removing q
            const params = new URLSearchParams(searchParams.toString());
            params.delete("action");
            const qs = params.toString();
            router.replace(qs ? `/notes?${qs}` : "/notes", { scroll: false });
        }
    }, [searchParams, router]);

    const handleCreate = async (draft: VisionNoteDraft) => {
        await createNote(draft);
    };

    const handleUpdate = async (draft: VisionNoteDraft) => {
        if (editingNote) {
            await updateNote(editingNote.id, draft);
        }
    };

    const openEditDialog = (note: VisionNoteRow) => {
        setEditingNote(note);
        setFormOpen(true);
    };

    const allNotes = useMemo(() => {
        return notesQuery.data?.pages.flatMap((page) => page) || [];
    }, [notesQuery.data]);

    const isLoading = notesQuery.isLoading && !notesQuery.data;

    return (
        <>
            <NoteFormDialog
                open={formOpen}
                onOpenChange={(open) => {
                    setFormOpen(open);
                    if (!open) setTimeout(() => setEditingNote(null), 200);
                }}
                onSubmit={editingNote ? handleUpdate : handleCreate}
                initialData={editingNote || undefined}
                isLoading={pending.creating || pending.updating}
            />

            <PageFrame
                header={
                    <SectionHeader
                        title="Notes"
                        description="Thoughts & Ideas."
                        actions={
                            <Button onClick={() => setFormOpen(true)} className="hidden md:flex gap-2">
                                <Plus className="h-4 w-4" />
                                New
                            </Button>
                        }
                    />
                }
            >
                <div className="col-span-full mb-4 md:mb-6">
                    <div className="relative hidden md:block max-w-md">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search notes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-card/50"
                        />
                    </div>
                </div>

                <div className="col-span-full">
                    {isLoading ? (
                        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-48 w-full rounded-2xl break-inside-avoid" />
                            ))}
                        </div>
                    ) : allNotes.length > 0 ? (
                        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4 pb-12">
                            {allNotes.map((note) => (
                                <article
                                    key={note.id}
                                    onClick={() => openEditDialog(note)}
                                    className="group relative break-inside-avoid rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm hover:shadow-md hover:border-border transition-all cursor-pointer backdrop-blur-sm"
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="font-semibold text-foreground line-clamp-2 leading-tight">
                                            {note.title}
                                        </h3>
                                        {note.pinned && (
                                            <Pin className="h-4 w-4 text-primary shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6 mb-4">
                                        {note.body}
                                    </p>
                                    <div className="flex flex-wrap items-center justify-between gap-2 mt-auto pt-2 border-t border-border/40">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                                                {note.vision_pillar}
                                            </span>
                                            <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border border-border">
                                                {note.note_type}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">
                                            {format(new Date(note.updated_at), "MMM d, yyyy")}
                                        </span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20">
                            <EmptyState
                                title="No notes found"
                                description={searchTerm ? "Try adjusting your search." : "Capture your first thought or idea."}
                                action={
                                    !searchTerm ? (
                                        <Button onClick={() => setFormOpen(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Capture Note
                                        </Button>
                                    ) : undefined
                                }
                            />
                        </div>
                    )}
                </div>
            </PageFrame>
        </>
    );
}
