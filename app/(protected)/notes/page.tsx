"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Pin, MoreVertical, Trash2, Edit3, NotebookPen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { FileAttachment } from "@/lib/supabase/storage";
import { MediaGalleryModal } from "@/components/notes/MediaGalleryModal";

import { PageFrame } from "@/components/structure/PageFrame";
import { SectionHeader } from "@/components/structure/SectionHeader";
import { LiveRegion } from "@/components/structure/LiveRegion";
import { FloatingActionButton } from "@/components/structure/FloatingActionButton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { useAuth } from "@/hooks/useAuth";
import { useNotes } from "@/hooks/useNotes";
import { NoteFormDialog } from "@/components/notes/NoteFormDialog";
import type { VisionNoteRow } from "@/lib/supabase/types";

export default function NotesPage() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const { notes, isLoading, updateNoteAsync, deleteNoteAsync } = useNotes(user?.id);

    const [announcement, setAnnouncement] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Dialog state
    const [formOpen, setFormOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<VisionNoteRow | null>(null);

    // Initial query param handling
    useEffect(() => {
        if (searchParams.get("action") === "new") {
            setEditingNote(null);
            setFormOpen(true);
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete("action");
            window.history.replaceState({}, "", newUrl);
        }
    }, [searchParams]);

    // Filtering logic
    const filteredNotes = useMemo(() => {
        return notes.filter((n) => {
            if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase()) && !n.body.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
            return true;
        });
    }, [notes, searchQuery]);

    // Split pinned vs unpinned
    const pinnedNotes = filteredNotes.filter((n) => n.pinned);
    const regularNotes = filteredNotes.filter((n) => !n.pinned);

    const handleEdit = (note: VisionNoteRow) => {
        setEditingNote(note);
        setFormOpen(true);
    };

    const handleTogglePin = async (note: VisionNoteRow) => {
        try {
            await updateNoteAsync({ id: note.id, payload: { pinned: !note.pinned } });
            setAnnouncement(`Note ${note.pinned ? "unpinned" : "pinned"}.`);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (note: VisionNoteRow) => {
        if (!window.confirm("Are you sure you want to permanently delete this note?")) return;
        try {
            await deleteNoteAsync(note.id);
            setAnnouncement("Note deleted.");
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <PageFrame
            header={
                <SectionHeader
                    title="Notes"
                    description="Capture context, risk, and vision."
                    icon={<NotebookPen className="h-5 w-5" />}
                    actions={
                        <Button
                            className="bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/90"
                            onClick={() => {
                                setEditingNote(null);
                                setFormOpen(true);
                            }}
                        >
                            <Plus className="h-4 w-4 mr-1.5" />
                            New Note
                        </Button>
                    }
                />
            }
        >
            {/* ═══════════════════════════════════════════════
                 SEARCH & FILTERS
            ═══════════════════════════════════════════════ */}
            <div className="col-span-full">
                <input
                    type="text"
                    placeholder="Search context..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-card/60 backdrop-blur-sm px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
            </div>

            {/* ═══════════════════════════════════════════════
                 SKELETON LOADING
            ═══════════════════════════════════════════════ */}
            {isLoading && (
                <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-[200px] w-full rounded-2xl bg-card/40 border border-white/5" />
                    ))}
                </div>
            )}

            {!isLoading && filteredNotes.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                    <NotebookPen className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-bold text-foreground">Empty Space</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-2">
                        You have no notes matching this filter. Start documenting your journey.
                    </p>
                    <Button
                        variant="link"
                        onClick={() => { setEditingNote(null); setFormOpen(true); }}
                        className="mt-4 text-primary"
                    >
                        Create your first note
                    </Button>
                </div>
            )}

            {/* ═══════════════════════════════════════════════
                 NOTE GRID RENDERER
            ═══════════════════════════════════════════════ */}
            {!isLoading && filteredNotes.length > 0 && (
                <div className="col-span-full space-y-8 mt-2">

                    {/* PINNED SECTION */}
                    {pinnedNotes.length > 0 && (
                        <section className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center gap-2">
                                <Pin className="h-3.5 w-3.5" /> Pinned
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {pinnedNotes.map((note) => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        onEdit={() => handleEdit(note)}
                                        onTogglePin={() => handleTogglePin(note)}
                                        onDelete={() => handleDelete(note)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* REGULAR SECTION */}
                    {regularNotes.length > 0 && (
                        <section className="space-y-4 pt-2">
                            {pinnedNotes.length > 0 && (
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                    Everything Else
                                </h3>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
                                {regularNotes.map((note) => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        onEdit={() => handleEdit(note)}
                                        onTogglePin={() => handleTogglePin(note)}
                                        onDelete={() => handleDelete(note)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            <LiveRegion message={announcement} />

            <NoteFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                editingNote={editingNote}
            />

            <FloatingActionButton
                label="New Note"
                onClick={() => { setEditingNote(null); setFormOpen(true); }}
            />
        </PageFrame>
    );
}

/* ─────────────────────────────────────────────────────────────
                             CARD UI
   ───────────────────────────────────────────────────────────── */

function NoteCard({
    note,
    onEdit,
    onTogglePin,
    onDelete
}: {
    note: VisionNoteRow;
    onEdit: () => void;
    onTogglePin: () => void;
    onDelete: () => void;
}) {
    // Dynamic styling based on impact score & type
    const isHighImpact = note.impact_score >= 8;
    const isSecret = note.note_type === "secret";

    // Media handling
    const [galleryOpen, setGalleryOpen] = useState(false);
    const attachments = (note.attachments as FileAttachment[]) || [];
    const imageCount = attachments.filter(a => a.type === "image").length;
    const audioCount = attachments.filter(a => a.type === "audio").length;
    const videoCount = attachments.filter(a => a.type === "video").length;
    const hasMedia = attachments.length > 0;

    const baseClasses = "relative group flex flex-col rounded-2xl border bg-card/40 backdrop-blur-md p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer";
    const borderClasses = isHighImpact
        ? "border-primary/30 hover:border-primary/50 shadow-[0_0_15px_-3px_rgba(var(--primary-rgb),0.1)]"
        : "border-white/5 hover:border-white/20 hover:bg-card/60";

    return (
        <div className={`${baseClasses} ${borderClasses}`} onClick={onEdit}>
            {/* Aesthetic Glow for high impact - moved inside a clipped container */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                {isHighImpact && (
                    <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
                )}
            </div>
            {/* Actions: Absolute positioned to reduce top space */}
            <div className="absolute top-4 right-4 opacity-0 transition-opacity group-hover:opacity-100 flex items-center gap-1 z-20" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
                    className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${note.pinned ? "text-primary" : "text-muted-foreground"}`}
                >
                    <Pin className="h-3.5 w-3.5" />
                </button>

                <DropdownMenu
                    trigger={
                        <div className="p-1.5 rounded-md text-muted-foreground hover:bg-white/10 transition-colors outline-none cursor-pointer">
                            <MoreVertical className="h-3.5 w-3.5" />
                        </div>
                    }
                >
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                        <Edit3 className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTogglePin(); }}>
                        <Pin className="mr-2 h-4 w-4" /> {note.pinned ? "Unpin" : "Pin context"}
                    </DropdownMenuItem>
                    <div className="my-1 h-px bg-white/5" />
                    <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                        <Trash2 className="mr-2 h-4 w-4" /> Destroy Note
                    </DropdownMenuItem>
                </DropdownMenu>
            </div>

            {/* Content */}
            <div className={`relative z-10 flex-1 flex flex-col ${isSecret ? 'blur-[3px] hover:blur-0 transition-all duration-300' : ''}`}>
                <h4 className={`text-base font-bold text-foreground mb-2 leading-snug line-clamp-2 pr-16`}>
                    {note.title}
                </h4>

                {note.body && (
                    <p className="text-sm text-muted-foreground/80 leading-relaxed whitespace-pre-wrap line-clamp-4 font-mono">
                        {note.body}
                    </p>
                )}

                {/* Attachments Preview Badge */}
                {hasMedia && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); setGalleryOpen(true); }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:border-primary/40 transition-all group/badge"
                        >
                            <span className="text-xs font-semibold text-primary/80 group-hover/badge:text-primary transition-colors flex items-center gap-1.5">
                                {imageCount > 0 && <span>🖼️ {imageCount} {imageCount === 1 ? 'Image' : 'Images'}</span>}
                                {imageCount > 0 && (audioCount > 0 || videoCount > 0) && <span>•</span>}
                                {audioCount > 0 && <span>🎤 {audioCount} {audioCount === 1 ? 'Audio' : 'Audio'}</span>}
                                {audioCount > 0 && videoCount > 0 && <span>•</span>}
                                {videoCount > 0 && <span>🎬 {videoCount} {videoCount === 1 ? 'Video' : 'Videos'}</span>}
                            </span>
                        </button>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 flex items-center justify-between border-t border-white/5 z-10">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60">
                    <span className="text-primary/70">{note.vision_pillar}</span>
                    <span className="opacity-30">•</span>
                    <span>{note.note_type}</span>
                    <span className="opacity-30">•</span>
                    <span className="text-muted-foreground/40">{note.horizon?.replace('_', ' ')}</span>
                </div>
                <span className="text-[10px] text-muted-foreground/40 font-medium">
                    {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                </span>
            </div>

            {/* Media Gallery Portal */}
            <MediaGalleryModal
                open={galleryOpen}
                onOpenChange={setGalleryOpen}
                media={attachments}
            />

        </div>
    );
}
