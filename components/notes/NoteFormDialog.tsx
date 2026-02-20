"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { VisionNoteType, VisionPillar } from "@/lib/supabase/types";
import type { VisionNoteDraft } from "@/hooks/useVisionNotes";
import { pushToast } from "@/components/ui/toast";

type NoteFormDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (draft: VisionNoteDraft) => Promise<void>;
    initialData?: Partial<VisionNoteDraft>;
    isLoading?: boolean;
};

const NOTE_TYPES: VisionNoteType[] = [
    "thought", "idea", "decision", "risk", "question",
    "milestone", "insight", "information", "secret"
];

const PILLARS: VisionPillar[] = [
    "product", "growth", "discipline", "health",
    "relationships", "learning", "operations"
];

export function NoteFormDialog({
    open,
    onOpenChange,
    onSubmit,
    initialData,
    isLoading
}: NoteFormDialogProps) {
    const [title, setTitle] = useState(initialData?.title || "");
    const [body, setBody] = useState(initialData?.body || "");
    const [type, setType] = useState<VisionNoteType>(initialData?.note_type || "thought");
    const [pillar, setPillar] = useState<VisionPillar>(initialData?.vision_pillar || "product");
    const [pinned, setPinned] = useState(initialData?.pinned || false);

    useEffect(() => {
        if (open) {
            setTitle(initialData?.title || "");
            setBody(initialData?.body || "");
            setType(initialData?.note_type || "thought");
            setPillar(initialData?.vision_pillar || "product");
            setPinned(initialData?.pinned || false);
        }
    }, [open, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onSubmit({
                title,
                body,
                note_type: type,
                vision_pillar: pillar,
                pinned
            });
            pushToast("Success", initialData ? "Note updated!" : "Note captured!");
            onOpenChange(false);
        } catch (err) {
            // Error is already pushed in hook, but we catch here to keep dialog open if needed
            console.error("Submit failed:", err);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] border-border/80 bg-card/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Note" : "Capture Note"}</DialogTitle>
                    <DialogDescription>
                        Record a thought, idea, or milestone.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <Input
                            required
                            placeholder="What's on your mind?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Details</label>
                        <Textarea
                            placeholder="Expand on it..."
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="min-h-[120px]"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Type</label>
                            <select
                                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                                value={type}
                                onChange={(e) => setType(e.target.value as VisionNoteType)}
                                disabled={isLoading}
                            >
                                {NOTE_TYPES.map(t => (
                                    <option key={t} value={t} className="capitalize">{t}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Pillar</label>
                            <select
                                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                                value={pillar}
                                onChange={(e) => setPillar(e.target.value as VisionPillar)}
                                disabled={isLoading}
                            >
                                {PILLARS.map(p => (
                                    <option key={p} value={p} className="capitalize">{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="pinned-note"
                            checked={pinned}
                            onChange={(e) => setPinned(e.target.checked)}
                            disabled={isLoading}
                            className="rounded border-border bg-background"
                        />
                        <label htmlFor="pinned-note" className="text-sm font-medium cursor-pointer">Pin to top</label>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !title}>
                            {isLoading ? "Saving..." : "Save Note"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
