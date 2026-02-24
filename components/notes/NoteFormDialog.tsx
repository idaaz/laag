"use client";

import { useEffect, useCallback, useState } from "react";
import { type SubmitHandler, useForm, Controller } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useNotes, type CreateNotePayload, type UpdateNotePayload } from "@/hooks/useNotes";
import { pushToast } from "@/components/ui/toast";
import { MediaCaptureZone } from "./MediaCaptureZone";
import type { FileAttachment } from "@/lib/supabase/storage";

const noteFormSchema = z.object({
    title: z.string().min(2, "Title must be at least 2 characters").max(100),
    body: z.string().max(10000).optional(),
    note_type: z.enum([
        "thought", "idea", "decision", "risk", "question",
        "milestone", "insight", "information", "secret"
    ]),
    vision_pillar: z.enum([
        "product", "growth", "discipline", "health",
        "relationships", "learning", "operations"
    ]),
    horizon: z.enum(["today", "this_week", "this_month", "quarter", "long_term"]),
    impact_score: z.number().min(1).max(10),
    pinned: z.boolean(),
    attachments: z.unknown().array().optional(),
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

type NoteFormDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingNote?: {
        id: string;
        title: string;
        body: string;
        note_type: NoteFormValues["note_type"];
        vision_pillar: NoteFormValues["vision_pillar"];
        horizon: NoteFormValues["horizon"];
        impact_score: number;
        pinned: boolean;
        attachments?: FileAttachment[] | Record<string, unknown>[] | unknown;
    } | null;
};

export function NoteFormDialog({ open, onOpenChange, editingNote }: NoteFormDialogProps) {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const { createNoteAsync, updateNoteAsync, isCreating, isUpdating } = useNotes(user?.id);
    const [isMediaUploading, setIsMediaUploading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        control,
        setValue,
        watch,
        formState: { errors },
    } = useForm<NoteFormValues>({
        resolver: zodResolver(noteFormSchema),
        defaultValues: {
            title: "",
            body: "",
            note_type: "thought",
            vision_pillar: "product",
            horizon: "this_week",
            impact_score: 5,
            pinned: false,
            attachments: [],
        },
    });

    const attachments = watch("attachments");

    const isSubmitting = isCreating || isUpdating || isMediaUploading;

    useEffect(() => {
        if (open) {
            if (editingNote) {
                console.log("NoteFormDialog: Populating for edit:", editingNote);
                reset({
                    title: editingNote.title || "",
                    body: editingNote.body || "",
                    note_type: (editingNote.note_type?.toLowerCase() as NoteFormValues["note_type"]) || "thought",
                    vision_pillar: (editingNote.vision_pillar?.toLowerCase() as NoteFormValues["vision_pillar"]) || "product",
                    horizon: (editingNote.horizon?.toLowerCase() as NoteFormValues["horizon"]) || "this_week",
                    impact_score: editingNote.impact_score ?? 5,
                    pinned: !!editingNote.pinned,
                    attachments: (Array.isArray(editingNote.attachments) ? editingNote.attachments : []) as unknown[],
                });
            } else {
                reset({
                    title: searchParams.get("title") || "",
                    body: "",
                    note_type: "thought",
                    vision_pillar: "product",
                    horizon: "this_week",
                    impact_score: 5,
                    pinned: false,
                    attachments: [] as unknown[],
                });
            }
        }
    }, [open, editingNote, reset, searchParams]);

    const onSubmit: SubmitHandler<NoteFormValues> = async (data) => {
        console.log("Submitting note form:", { isEditing: !!editingNote, data });
        try {
            if (editingNote) {
                await updateNoteAsync({ id: editingNote.id, payload: data as UpdateNotePayload });
                pushToast("Note updated successfully");
            } else {
                await createNoteAsync(data as CreateNotePayload);
                pushToast("Note created successfully");
            }
            onOpenChange(false);
        } catch (error: unknown) {
            console.error("Error saving note details:", error);

            let message = "Unknown error occurred";
            if (error instanceof Error) {
                message = error.message;
            } else if (typeof error === 'object' && error !== null && 'message' in error) {
                message = String((error as { message: string }).message);
            } else {
                message = String(error);
            }

            pushToast("Failed to save note", message);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Prevent Enter from submitting the form if we are in the middle of media work or if it's from an input we want to control
        if (e.key === "Enter" && (isMediaUploading || (e.target as HTMLElement).tagName !== "TEXTAREA")) {
            // Only allow Enter to submit from the Title input, or block it entirely if uploading
            if (isMediaUploading) {
                e.preventDefault();
            }
        }
    };

    const handleAttachmentsChange = useCallback((newAttachments: FileAttachment[]) => {
        setValue("attachments", newAttachments);
    }, [setValue]);

    const handleUploadingChange = useCallback((uploadingStatus: boolean) => {
        setIsMediaUploading(uploadingStatus);
    }, []);

    // Log validation errors for debugging
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            console.warn("Note form validation errors:", errors);
        }
    }, [errors]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl border border-border/80 text-foreground shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold tracking-tight">
                        {editingNote ? "Edit Note" : "Capture Thought"}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Document your context, insights, or crucial decisions.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    onKeyDown={handleKeyDown}
                    className="space-y-6 mt-4"
                >
                    <div className="space-y-4">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Headline
                            </Label>
                            <Input
                                id="title"
                                placeholder="E.g., Breakthrough on product architecture..."
                                className="bg-background/50 border-white/10 placeholder:text-muted-foreground/50 text-base"
                                {...register("title")}
                            />
                            {errors.title && <p className="text-xs text-destructive mt-1 font-medium">{errors.title.message}</p>}
                        </div>

                        {/* Body */}
                        <div className="space-y-2">
                            <Label htmlFor="body" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Context
                            </Label>
                            <Textarea
                                id="body"
                                placeholder="Elaborate on the idea, log the decision rationale, or jot down raw thoughts..."
                                className="bg-background/50 border-white/10 min-h-[160px] resize-none text-sm placeholder:text-muted-foreground/50"
                                {...register("body")}
                            />
                            {errors.body && <p className="text-xs text-destructive mt-1 font-medium">{errors.body.message}</p>}
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Stereotype (Pillar) */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Stereotype
                                </Label>
                                <Controller
                                    name="vision_pillar"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            key={editingNote?.id || "new-pillar"}
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <SelectTrigger className="bg-background/50 border-white/10 h-10">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {["product", "growth", "discipline", "health", "relationships", "learning", "operations"].map((p) => (
                                                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.vision_pillar && <p className="text-xs text-destructive mt-1 font-medium">{errors.vision_pillar.message}</p>}
                            </div>

                            {/* Horizon */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Horizon
                                </Label>
                                <Controller
                                    name="horizon"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            key={editingNote?.id || "new-horizon"}
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <SelectTrigger className="bg-background/50 border-white/10 h-10">
                                                <SelectValue placeholder="Select horizon" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {["today", "this_week", "this_month", "quarter", "long_term"].map((h) => (
                                                    <SelectItem key={h} value={h} className="capitalize">{h.replace('_', ' ')}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.horizon && <p className="text-xs text-destructive mt-1 font-medium">{errors.horizon.message}</p>}
                            </div>

                            {/* Note Type */}
                            <div className="space-y-2 col-span-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Type
                                </Label>
                                <Controller
                                    name="note_type"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            key={editingNote?.id || "new-type"}
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <SelectTrigger className="bg-background/50 border-white/10 h-10">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {["thought", "idea", "insight", "decision", "risk", "question", "milestone", "information", "secret"].map((t) => (
                                                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.note_type && <p className="text-xs text-destructive mt-1 font-medium">{errors.note_type.message}</p>}
                            </div>
                        </div>

                        {/* Impact Settings */}
                        <div className="grid grid-cols-2 gap-4 items-center rounded-xl bg-card/40 border border-white/5 p-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Impact Score (1-10)
                                </Label>
                                <Input
                                    type="number"
                                    min={1} max={10}
                                    className="bg-background/50 border-white/10 w-full"
                                    {...register("impact_score", { valueAsNumber: true })}
                                />
                                {errors.impact_score && <p className="text-xs text-destructive mt-1 font-medium">{errors.impact_score.message}</p>}
                            </div>

                            <div className="flex items-center justify-end space-x-3 pt-6">
                                <Label htmlFor="pinned" className="text-sm font-medium cursor-pointer">
                                    Pin to top
                                </Label>
                                <input
                                    type="checkbox"
                                    id="pinned"
                                    className="h-5 w-5 rounded-md border-input bg-background/50 accent-primary cursor-pointer"
                                    {...register("pinned")}
                                />
                            </div>
                        </div>

                        {/* Multimedia Zone */}
                        {user && (
                            <MediaCaptureZone
                                userId={user.id}
                                initialAttachments={attachments as FileAttachment[]}
                                onAttachmentsChange={handleAttachmentsChange}
                                onUploadingChange={handleUploadingChange}
                            />
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="hover:bg-white/5"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-primary text-white shadow-md hover:bg-primary/90 min-w-[100px]"
                        >
                            {isSubmitting
                                ? (isMediaUploading ? "Uploading..." : "Saving...")
                                : (editingNote ? "Update" : "Save Note")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
