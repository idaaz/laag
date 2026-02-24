"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type { HabitQuestionRow } from "@/lib/supabase/types";
import { useMouseScrollIncrement } from "@/hooks/useMouseScrollIncrement";

export type QuestionDraft = Omit<
    HabitQuestionRow,
    "id" | "habit_id" | "user_id" | "created_at" | "updated_at"
> & { id?: string };

const OPTIONAL_THINGS_TEXT = "Optional Things";
const DEFAULT_OPTIONAL_QUESTION: QuestionDraft = {
    id: undefined,
    question_text: OPTIONAL_THINGS_TEXT,
    answer_type: "text",
    dropdown_options: null,
    display_order: 999
};

export function HabitFormDialog({
    open,
    onOpenChange,
    onSubmit,
    initialName,
    initialQuestions,
    initialFrequency,
    initialXP,
    initialTimeOfDay,
    initialSpecificTime
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: {
        name: string;
        questions: QuestionDraft[];
        frequency_per_week: number;
        xp_per_completion: number;
        time_of_day: "morning" | "afternoon" | "evening" | "night" | "anytime";
        specific_time: string | null;
    }) => Promise<void>;
    initialName?: string;
    initialQuestions?: QuestionDraft[];
    initialFrequency?: number;
    initialXP?: number;
    initialTimeOfDay?: "morning" | "afternoon" | "evening" | "night" | "anytime";
    initialSpecificTime?: string | null;
}) {
    const [name, setName] = useState(initialName ?? "");
    const [frequency, setFrequency] = useState(initialFrequency ?? 5);
    const [xp, setXP] = useState(initialXP ?? 5);
    const [timeOfDay, setTimeOfDay] = useState<"morning" | "afternoon" | "evening" | "night" | "anytime">(initialTimeOfDay ?? "anytime");
    const [specificTime, setSpecificTime] = useState(initialSpecificTime ?? "");

    const { onWheel: onFrequencyWheel } = useMouseScrollIncrement(frequency, setFrequency, { min: 1, max: 7 });
    const { onWheel: onXPWheel } = useMouseScrollIncrement(xp, setXP, { min: 1, max: 25 }); // Expanded max XP slightly

    const [questions, setQuestions] = useState<QuestionDraft[]>(() => {
        const qs = initialQuestions ?? [];
        const hasOptional = qs.some(q => q.question_text === OPTIONAL_THINGS_TEXT);
        if (!hasOptional) {
            return [...qs, DEFAULT_OPTIONAL_QUESTION];
        }
        return qs;
    });
    const [submitting, setSubmitting] = useState(false);

    const addQuestion = () => {
        const insertIndex = questions.length > 0 ? questions.length - 1 : 0;
        const newQuestions = [...questions];
        newQuestions.splice(insertIndex, 0, {
            id: undefined,
            question_text: "",
            answer_type: "text",
            dropdown_options: null,
            display_order: questions.length
        });
        setQuestions(newQuestions);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = <K extends keyof QuestionDraft>(
        index: number,
        field: K,
        value: QuestionDraft[K]
    ) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        setQuestions(updated);
    };

    const handleSubmit = async () => {
        const trimmedName = name.trim();
        if (trimmedName.length < 2 || trimmedName.length > 120) return;
        setSubmitting(true);
        try {
            await onSubmit({
                name: trimmedName,
                questions,
                frequency_per_week: frequency,
                xp_per_completion: xp,
                time_of_day: timeOfDay,
                specific_time: specificTime || null
            });
            setName("");
            setQuestions([]);
            setTimeOfDay("anytime");
            setSpecificTime("");
            onOpenChange(false);
        } catch (error) {
            console.error("Habit submission error:", error);
            if (error instanceof Error) {
                console.error("Error message:", error.message);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialName ? "Edit Habit" : "Create Habit"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label>Habit Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Morning deep work" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-y border-border/30 py-4 my-2">
                        <div className="space-y-2">
                            <Label className="text-sm">Frequency (Days/Week)</Label>
                            <Input
                                type="number"
                                value={frequency}
                                onChange={(e) => setFrequency(Math.max(1, Math.min(7, parseInt(e.target.value) || 1)))}
                                onWheel={onFrequencyWheel}
                                min={1}
                                max={7}
                                className="h-9"
                                title="Scroll to change"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm">XP per Completion</Label>
                            <Input
                                type="number"
                                value={xp}
                                onChange={(e) => setXP(Math.max(1, Math.min(25, parseInt(e.target.value) || 1)))}
                                onWheel={onXPWheel}
                                min={1}
                                max={25}
                                className="h-9"
                                title="Scroll to change"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border/30 mb-2">
                        <div className="space-y-2">
                            <Label className="text-sm">Time of Day</Label>
                            <Select value={timeOfDay} onValueChange={(v: "morning" | "afternoon" | "evening" | "night" | "anytime") => setTimeOfDay(v)}>
                                <SelectTrigger className="h-9 bg-background/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="morning">Morning</SelectItem>
                                    <SelectItem value="afternoon">Afternoon</SelectItem>
                                    <SelectItem value="evening">Evening</SelectItem>
                                    <SelectItem value="night">Night</SelectItem>
                                    <SelectItem value="anytime">Anytime</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm">Specific Time (Optional)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="time"
                                    value={specificTime}
                                    onChange={(e) => setSpecificTime(e.target.value)}
                                    className="h-9 bg-background/50 flex-1"
                                />
                                {specificTime && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSpecificTime("")}
                                        className="h-9 px-2 text-muted-foreground hover:text-destructive"
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-mono uppercase text-primary/70">Custom Questions (Optional)</Label>
                            <Button onClick={addQuestion} variant="outline" size="sm" className="gap-2">
                                <Plus className="w-4 h-4" /> Add Question
                            </Button>
                        </div>

                        {questions.map((q, idx) => (
                            <div key={idx} className="border border-border/50 rounded-md p-3 space-y-2 bg-secondary/10">
                                <div className="flex items-start gap-2">
                                    <div className="flex-1 space-y-2">
                                        <Input
                                            value={q.question_text}
                                            onChange={(e) => updateQuestion(idx, "question_text", e.target.value)}
                                            placeholder="How many reps?"
                                            className="text-sm"
                                            disabled={q.question_text === OPTIONAL_THINGS_TEXT}
                                        />

                                        <div className="grid grid-cols-2 gap-2">
                                            <Select
                                                value={q.answer_type}
                                                onValueChange={(value) =>
                                                    updateQuestion(idx, "answer_type", value as QuestionDraft["answer_type"])
                                                }
                                            >
                                                <SelectTrigger className="text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="text">Standard Text</SelectItem>
                                                    <SelectItem value="number">Number</SelectItem>
                                                    <SelectItem value="percentage">Percentage</SelectItem>
                                                    <SelectItem value="link">Link</SelectItem>
                                                    <SelectItem value="clock_timer">Clock Timer</SelectItem>
                                                    <SelectItem value="counting_timer">Counting Timer</SelectItem>
                                                    <SelectItem value="dropdown">Dropdown</SelectItem>
                                                    <SelectItem value="checkbox">Checkboxes</SelectItem>
                                                    <SelectItem value="radio">Radio Buttons</SelectItem>
                                                    <SelectItem value="file">File Upload</SelectItem>
                                                    <SelectItem value="listing">Listing</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            {(q.answer_type === "dropdown" || q.answer_type === "radio" || q.answer_type === "checkbox") && (
                                                <Input
                                                    placeholder="Options (comma-separated)"
                                                    defaultValue={q.dropdown_options?.join(", ") ?? ""}
                                                    onBlur={(e) => {
                                                        const values = e.target.value
                                                            .split(",")
                                                            .map((s) => s.trim())
                                                            .filter(Boolean);
                                                        updateQuestion(idx, "dropdown_options", values.length > 0 ? values : null);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            (e.target as HTMLInputElement).blur();
                                                        }
                                                    }}
                                                    className="text-xs"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => removeQuestion(idx)}
                                        variant="ghost"
                                        size="icon"
                                        className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        title="Delete Question"
                                        disabled={q.question_text === OPTIONAL_THINGS_TEXT}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)} variant="outline">Cancel</Button>
                    <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
                        {submitting ? "..." : initialName ? "Update" : "Create"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
