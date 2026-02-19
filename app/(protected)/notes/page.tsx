"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Compass,
  Lightbulb,
  Search,
  Sparkles,
  Target,
  Trash2,
  Loader2,
  Pin,
  PinOff
} from "lucide-react";
import { AppCard } from "@/components/structure/AppCard";
import { PageFrame } from "@/components/structure/PageFrame";
import { QuickActionBar } from "@/components/structure/QuickActionBar";
import { SectionHeader } from "@/components/structure/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { pushToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { useRealtime } from "@/hooks/useRealtime";
import { useVisionNotes, type VisionNoteDraft, VISION_NOTES_QUERY_KEY } from "@/hooks/useVisionNotes";
import type {
  VisionNoteRow,
  VisionNoteType,
  VisionPillar
} from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { FloatingActionButton } from "@/components/structure/FloatingActionButton";

const NOTE_TYPE_OPTIONS: Array<{ value: VisionNoteType; label: string }> = [
  { value: "idea", label: "Idea" },
  { value: "information", label: "Information" },
  { value: "thought", label: "Random thought" },
  { value: "question", label: "Question" },
  { value: "secret", label: "Secret" },
  { value: "decision", label: "Decision" },
  { value: "risk", label: "Risk" },
  { value: "insight", label: "Insight" },
  { value: "milestone", label: "Milestone" }
];

const PILLAR_OPTIONS: Array<{ value: VisionPillar; label: string }> = [
  { value: "product", label: "Product" },
  { value: "growth", label: "Growth" },
  { value: "discipline", label: "Discipline" },
  { value: "health", label: "Health" },
  { value: "relationships", label: "Relationships" },
  { value: "learning", label: "Learning" },
  { value: "operations", label: "Operations" }
];

const EMPTY_DRAFT: VisionNoteDraft = {
  title: "",
  body: "",
  note_type: "idea",
  vision_pillar: "product",
  pinned: false
};

type ViewTab = "board" | "pinned" | "archive";

function toFriendlyDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

const NOTE_TYPE_TONES: Record<VisionNoteType, string> = {
  idea: "border-primary/35 bg-primary/5",
  thought: "border-border/75 bg-background/55",
  decision: "border-success/35 bg-success/10",
  risk: "border-destructive/35 bg-destructive/10",
  question: "border-warning/35 bg-warning/10",
  insight: "border-accent/35 bg-accent/10",
  milestone: "border-primary/40 bg-primary/10",
  information: "border-blue-500/35 bg-blue-500/10",
  secret: "border-violet-500/35 bg-violet-500/10"
};



export default function NotesPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<VisionNoteDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [viewTab, setViewTab] = useState<ViewTab>("board");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | VisionNoteType>("all");
  const [pillarFilter, setPillarFilter] = useState<"all" | VisionPillar>("all");

  const { notesQuery, createNote, updateNote, deleteNote, togglePin, toggleArchive, pending } = useVisionNotes(userId, {
    viewTab,
    type: typeFilter,
    pillar: pillarFilter,
    search
  });

  // Real-time updates for notes
  useRealtime(
    ["vision_notes"],
    [[VISION_NOTES_QUERY_KEY, userId || ""] as string[]]
  );

  // Flatten pages for rendering
  const allNotes = useMemo(() => {
    return notesQuery.data?.pages.flatMap((page) => page) ?? [];
  }, [notesQuery.data]);

  useEffect(() => {
    if (searchParams.get("action") !== "new") return;
    const requestedType = searchParams.get("type");
    const validType = NOTE_TYPE_OPTIONS.find((option) => option.value === requestedType)?.value ?? "idea";
    setEditingId(null);
    setDraft({
      ...EMPTY_DRAFT,
      note_type: validType
    });
    setViewTab("board");
    router.replace("/notes", { scroll: false });
    window.requestAnimationFrame(() => titleInputRef.current?.focus());
  }, [searchParams, router]);

  async function handleSaveDraft() {
    const normalizedTitle = draft.title.trim();
    const normalizedBody = draft.body.trim();
    if (normalizedTitle.length < 2) {
      pushToast("Title required", "Give the note a short clear title.");
      return;
    }
    if (normalizedBody.length < 1) {
      pushToast("Body required", "Capture the thought before saving.");
      return;
    }

    const normalizedDraft: VisionNoteDraft = {
      ...draft,
      title: normalizedTitle,
      body: normalizedBody
    };

    try {
      if (editingId) {
        await updateNote(editingId, normalizedDraft);
        pushToast("Note updated", "Your vision note has been updated.");
      } else {
        await createNote(normalizedDraft);
        pushToast("Note captured", "Added to your vision board.");
      }
      clearDraft();
    } catch (error) {
      console.error("Failed to save note:", error);
      pushToast("Save failed", error instanceof Error ? error.message : "Try again.");
    }
  }

  function clearDraft() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  }

  function editNote(note: VisionNoteRow) {
    setEditingId(note.id);
    setDraft({
      title: note.title,
      body: note.body,
      note_type: note.note_type,
      vision_pillar: note.vision_pillar,
      pinned: note.pinned
    });
    document.getElementById("notes-capture-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.requestAnimationFrame(() => titleInputRef.current?.focus());
  }



  return (
    <PageFrame
      header={
        <SectionHeader
          title="Notes"
          description="Capture thoughts, ideas, and decisions tied to your project vision."
          icon={<Compass className="h-5 w-5" />}
          actions={
            <QuickActionBar
              className="hidden md:flex"
              actions={[
                {
                  id: "capture-idea",
                  label: "Idea",
                  icon: <Lightbulb className="h-4 w-4" />,
                  tooltip: "Capture a product/growth idea.",
                  onRun: () => {
                    setEditingId(null);
                    setDraft({
                      ...EMPTY_DRAFT,
                      note_type: "idea",
                      vision_pillar: "product"
                    });
                    titleInputRef.current?.focus();
                  }
                },
                {
                  id: "capture-info",
                  label: "Information",
                  icon: <Sparkles className="h-4 w-4" />,
                  tooltip: "Capture useful information.",
                  onRun: () => {
                    setEditingId(null);
                    setDraft({
                      ...EMPTY_DRAFT,
                      note_type: "information",
                      vision_pillar: "learning"
                    });
                    titleInputRef.current?.focus();
                  }
                },
                {
                  id: "capture-thought",
                  label: "Thought",
                  icon: <Target className="h-4 w-4" />,
                  tooltip: "Capture a random thought.",
                  onRun: () => {
                    setEditingId(null);
                    setDraft({
                      ...EMPTY_DRAFT,
                      note_type: "thought",
                      vision_pillar: "discipline"
                    });
                    titleInputRef.current?.focus();
                  }
                },
                {
                  id: "capture-question",
                  label: "Question",
                  icon: <Compass className="h-4 w-4" />,
                  tooltip: "Capture a burning question.",
                  onRun: () => {
                    setEditingId(null);
                    setDraft({
                      ...EMPTY_DRAFT,
                      note_type: "question",
                      vision_pillar: "product"
                    });
                    titleInputRef.current?.focus();
                  }
                },
                {
                  id: "capture-secret",
                  label: "Secret",
                  icon: <Pin className="h-4 w-4" />,
                  tooltip: "Capture a secret or private note.",
                  onRun: () => {
                    setEditingId(null);
                    setDraft({
                      ...EMPTY_DRAFT,
                      note_type: "secret",
                      vision_pillar: "growth"
                    });
                    titleInputRef.current?.focus();
                  }
                }
              ]}
            />
          }
        />
      }
    >
      <div className="col-span-full md:hidden">
        <QuickActionBar
          actions={[
            {
              id: "mobile-new",
              label: "New",
              icon: <Lightbulb className="h-4 w-4" />,
              onRun: () => {
                setEditingId(null);
                setDraft(EMPTY_DRAFT);
                titleInputRef.current?.focus();
              }
            },
            {
              id: "mobile-pinned",
              label: "Pinned",
              icon: <Pin className="h-4 w-4" />,
              onRun: () => setViewTab("pinned")
            }
          ]}
        />
      </div>

      <div className="col-span-full lg:col-span-4">
        <AppCard
          id="notes-capture-card"
          title={editingId ? "Edit Note" : "Capture Note"}
          hint="Connect every note to pillar and horizon."
          actions={
            editingId ? (
              <Button size="sm" variant="outline" onClick={clearDraft}>
                Cancel
              </Button>
            ) : null
          }
        >
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="note-title">Title</Label>
              <Input
                id="note-title"
                ref={titleInputRef}
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="What matters right now?"
                maxLength={180}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="note-body">Details</Label>
              <Textarea
                id="note-body"
                value={draft.body}
                onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
                placeholder="Write your thought, why it matters, and the next move."
                className="min-h-[180px]"
                maxLength={10000}
              />
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select
                  value={draft.note_type}
                  onValueChange={(value) => setDraft((current) => ({ ...current, note_type: value as VisionNoteType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTE_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Pillar</Label>
                <Select
                  value={draft.vision_pillar}
                  onValueChange={(value) =>
                    setDraft((current) => ({ ...current, vision_pillar: value as VisionPillar }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PILLAR_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <label className="flex items-center gap-2 rounded-lg border border-border/80 bg-background/60 px-3 py-2">
              <Checkbox
                checked={draft.pinned}
                onCheckedChange={(checked) => setDraft((current) => ({ ...current, pinned: Boolean(checked) }))}
              />
              <span className="text-sm">Pin this note on top</span>
            </label>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleSaveDraft}
                disabled={pending.creating || pending.updating || !userId}
              >
                {editingId ? "Update Note" : "Save Note"}
              </Button>
              <Button variant="outline" onClick={clearDraft} disabled={pending.creating || pending.updating}>
                Reset
              </Button>
            </div>
          </div>
        </AppCard>
      </div>

      <div className="col-span-full space-y-3 lg:col-span-8">
        <AppCard title="Vision Note Board" hint="Capture notes and filter by type or pillar.">
          <Tabs value={viewTab} onValueChange={(value) => setViewTab(value as ViewTab)}>
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="board">Board</TabsTrigger>
              <TabsTrigger value="pinned">Pinned</TabsTrigger>
              <TabsTrigger value="archive">Archive</TabsTrigger>
            </TabsList>

            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search title or body..."
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as "all" | VisionNoteType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Type filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {NOTE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={pillarFilter}
                onValueChange={(value) => setPillarFilter(value as "all" | VisionPillar)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pillar filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pillars</SelectItem>
                  {PILLAR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="board" className="mt-3">
              {notesQuery.isLoading && !notesQuery.data ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((item) => (
                    <Skeleton key={item} className="h-[176px] w-full rounded-xl" />
                  ))}
                </div>
              ) : allNotes.length ? (
                <>
                  <div className="space-y-2">
                    {allNotes.map((note) => {
                      return (
                        <article
                          key={note.id}
                          className={cn(
                            "rounded-xl border p-3 transition-colors",
                            NOTE_TYPE_TONES[note.note_type],
                            "hover:border-primary/40"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-semibold leading-tight">{note.title}</h3>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Updated {toFriendlyDateTime(note.updated_at)}
                              </p>
                            </div>
                            <button
                              type="button"
                              className="rounded-md border border-border/70 bg-background/70 p-1 hover:bg-background"
                              onClick={() => togglePin(note)}
                              aria-label={note.pinned ? "Unpin note" : "Pin note"}
                            >
                              {note.pinned ? <Pin className="h-4 w-4 text-primary" /> : <PinOff className="h-4 w-4" />}
                            </button>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-1">
                            <Badge variant="secondary">{note.note_type}</Badge>
                            <Badge variant="outline">{note.vision_pillar}</Badge>
                          </div>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-5 line-clamp-4">{note.body}</p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => editNote(note)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => toggleArchive(note)}>
                              Archive
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={async () => {
                                const confirmed = window.confirm("Delete this note permanently?");
                                if (!confirmed) return;
                                try {
                                  await deleteNote(note.id);
                                  pushToast("Deleted", "Note removed permanently.");
                                } catch (error) {
                                  pushToast("Delete failed", error instanceof Error ? error.message : "Try again.");
                                }
                              }}
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  {notesQuery.hasNextPage && (
                    <div className="mt-4 flex justify-center">
                      <Button
                        variant="outline"
                        onClick={() => notesQuery.fetchNextPage()}
                        disabled={notesQuery.isFetchingNextPage}
                      >
                        {notesQuery.isFetchingNextPage ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load More"
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  title="No notes in this view"
                  description="Capture an idea or adjust filters to surface relevant notes."
                  action={
                    <Button
                      onClick={() => {
                        setViewTab("board");
                        setSearch("");
                        setTypeFilter("all");
                        setPillarFilter("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  }
                />
              )}
            </TabsContent>

            <TabsContent value="pinned" className="mt-3">
              {allNotes.filter((note) => note.pinned && !note.archived).length ? (
                <div className="space-y-2">
                  {allNotes
                    .filter((note) => note.pinned && !note.archived)
                    .map((note) => (
                      <article key={note.id} className="rounded-xl border border-primary/35 bg-primary/10 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{note.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {note.note_type} • {note.vision_pillar}
                            </p>
                          </div>
                          <Badge variant="outline">Pinned</Badge>
                        </div>
                        <p className="mt-2 line-clamp-3 text-sm">{note.body}</p>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" onClick={() => editNote(note)}>
                            Open
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => togglePin(note)}>
                            Unpin
                          </Button>
                        </div>
                      </article>
                    ))}
                </div>
              ) : (
                <EmptyState
                  title="No pinned notes"
                  description="Pin important notes to keep them at the top and easily accessible."
                />
              )}
            </TabsContent>

            <TabsContent value="archive" className="mt-3">
              {allNotes.filter((note) => note.archived).length ? (
                <div className="space-y-2">
                  {allNotes.filter((note) => note.archived).map((note) => (
                    <article key={note.id} className="rounded-xl border border-border/70 bg-background/55 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{note.title}</p>
                          <p className="text-xs text-muted-foreground">Archived note</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => toggleArchive(note)}>
                          Restore
                        </Button>
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{note.body}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="No archived notes" description="Archive completed or outdated notes to keep focus." />
              )}
            </TabsContent>
          </Tabs>
        </AppCard>
      </div>

      <FloatingActionButton
        label="New Note"
        onClick={() => {
          setEditingId(null);
          setDraft(EMPTY_DRAFT);
          document.getElementById("notes-capture-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
          window.requestAnimationFrame(() => titleInputRef.current?.focus());
        }}
      />
    </PageFrame >
  );
}
