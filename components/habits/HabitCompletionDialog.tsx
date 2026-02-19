"use client";

import { useState } from "react";
import { pushToast } from "@/components/ui/toast";
import type { HabitQuestionRow } from "@/lib/supabase/types";
import { RollingTimePicker } from "@/components/ui/RollingTimePicker";
import { formatCountingTimer, parseCountingTimer } from "@/lib/utils/timeUtils";
import { useMouseScrollIncrement } from "@/hooks/useMouseScrollIncrement";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function CountingTimerInput({ value, onChange }: { value: string; onChange: (val: string) => void }) {
    const mins = parseFloat(value) || 0;
    const { onWheel } = useMouseScrollIncrement(mins, (v) => onChange(v.toString()), {
        min: 0,
        step: 1,
        bigStep: 5
    });

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Input
                    type="text"
                    value={value ? formatCountingTimer(parseFloat(value)) : ""}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                            onChange("");
                            return;
                        }
                        // If it's just numbers, treat as minutes
                        if (/^\d*\.?\d*$/.test(val)) {
                            onChange(val);
                        } else {
                            // Try to parse natural language
                            onChange(parseCountingTimer(val).toString());
                        }
                    }}
                    onBlur={(e) => {
                        const parsed = parseCountingTimer(e.target.value);
                        onChange(parsed.toString());
                    }}
                    onWheel={onWheel}
                    placeholder="e.g. 1.5 min, 6 sec, 1h 10m"
                    className="flex-1"
                    title="Scroll to change minutes. Supports '1h 10m', '6 sec', etc."
                />
            </div>
            {value && (
                <p className="text-[10px] text-muted-foreground px-1">
                    Stored as: <span className="font-mono text-primary">{value}</span> min
                </p>
            )}
        </div>
    );
}

function NumericInput({ value, onChange, min, max, step = 1, bigStep = 10, suffix }: {
    value: string;
    onChange: (val: string) => void;
    min?: number;
    max?: number;
    step?: number;
    bigStep?: number;
    suffix?: string;
}) {
    const numValue = parseFloat(value) || 0;
    const { onWheel } = useMouseScrollIncrement(numValue, (v) => onChange(v.toString()), { min, max, step, bigStep });

    return (
        <div className="flex items-center gap-2">
            <Input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onWheel={onWheel}
                min={min}
                max={max}
                step={step}
                className="flex-1"
                title="Scroll to change"
            />
            {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        </div>
    );
}

function MultiCheckboxGroup({
    options,
    value,
    onChange
}: {
    options: string[];
    value: string;
    onChange: (val: string) => void
}) {
    // value is stored as a JSON string of string[] or simple comma separated
    const selected: string[] = (() => {
        try {
            return JSON.parse(value || "[]");
        } catch {
            return value ? value.split(",").map(s => s.trim()) : [];
        }
    })();

    const toggle = (option: string) => {
        const next = selected.includes(option)
            ? selected.filter(s => s !== option)
            : [...selected, option];
        onChange(JSON.stringify(next));
    };

    return (
        <div className="grid grid-cols-2 gap-2 py-1">
            {options.map((option) => (
                <label key={option} className="flex items-center gap-2 cursor-pointer group p-2 rounded-md border border-border/10 hover:bg-secondary/20 transition-colors">
                    <Checkbox
                        checked={selected.includes(option)}
                        onCheckedChange={() => toggle(option)}
                    />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground">
                        {option}
                    </span>
                </label>
            ))}
        </div>
    );
}

export function HabitCompletionDialog({
    open,
    onOpenChange,
    questions,
    onSubmit
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    questions: HabitQuestionRow[];
    onSubmit: (answers: { questionId: string; value: string }[]) => Promise<void>;
}) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            console.log("Submitting answers for questions:", questions.map(q => q.id));
            const formattedAnswers = questions.map((q) => ({
                questionId: q.id,
                value: answers[q.id] ?? ""
            }));
            await onSubmit(formattedAnswers);
            setAnswers({});
            onOpenChange(false);
        } catch (error) {
            console.error("Error details:", JSON.stringify(error, null, 2));
            pushToast("Log failed", error instanceof Error ? error.message : "Unknown error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-primary">Log Completion</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    {questions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No questions for this habit.</p>
                    ) : (
                        questions.map((q) => (
                            <div key={q.id} className="space-y-3 p-3 rounded-lg border border-border/30 bg-secondary/5">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    {q.question_text}
                                </Label>

                                {q.answer_type === "text" && (
                                    <Textarea
                                        value={answers[q.id] ?? ""}
                                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                        placeholder="Your answer..."
                                        rows={2}
                                        className="resize-none"
                                    />
                                )}

                                {q.answer_type === "number" && (
                                    <NumericInput
                                        value={answers[q.id] ?? ""}
                                        onChange={(val) => setAnswers({ ...answers, [q.id]: val })}
                                    />
                                )}

                                {q.answer_type === "link" && (
                                    <Input
                                        type="url"
                                        value={answers[q.id] ?? ""}
                                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                        placeholder="https://example.com"
                                    />
                                )}

                                {q.answer_type === "clock_timer" && (
                                    <RollingTimePicker
                                        value={answers[q.id] ?? "00:00"}
                                        onChange={(val) => setAnswers({ ...answers, [q.id]: val })}
                                    />
                                )}

                                {q.answer_type === "percentage" && (
                                    <NumericInput
                                        value={answers[q.id] ?? ""}
                                        onChange={(val) => setAnswers({ ...answers, [q.id]: val })}
                                        min={0}
                                        max={100}
                                        suffix="%"
                                    />
                                )}

                                {q.answer_type === "checkbox" && (
                                    q.dropdown_options && q.dropdown_options.length > 0 ? (
                                        <MultiCheckboxGroup
                                            options={q.dropdown_options}
                                            value={answers[q.id] || "[]"}
                                            onChange={(val) => setAnswers({ ...answers, [q.id]: val })}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 py-1">
                                            <Checkbox
                                                checked={answers[q.id] === "true"}
                                                onCheckedChange={(checked) => setAnswers({ ...answers, [q.id]: checked ? "true" : "false" })}
                                            />
                                            <span className="text-sm text-muted-foreground whitespace-nowrap">Completed</span>
                                        </div>
                                    )
                                )}

                                {q.answer_type === "radio" && (
                                    <div className="grid grid-cols-2 gap-2 py-1">
                                        {(q.dropdown_options ?? []).map((option, idx) => (
                                            <label key={idx} className="flex items-center gap-2 cursor-pointer group p-2 rounded-md border border-border/10 hover:bg-secondary/20 transition-colors">
                                                <input
                                                    type="radio"
                                                    name={`q-${q.id}`}
                                                    value={option}
                                                    checked={answers[q.id] === option}
                                                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                                    className="w-4 h-4 border-gray-300 text-primary focus:ring-primary"
                                                />
                                                <span className="text-xs text-muted-foreground group-hover:text-foreground">
                                                    {option}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {q.answer_type === "file" && (
                                    <Input
                                        type="file"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setAnswers({ ...answers, [q.id]: file.name });
                                            }
                                        }}
                                        className="text-xs"
                                    />
                                )}

                                {q.answer_type === "listing" && (
                                    <Textarea
                                        value={answers[q.id] ?? ""}
                                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                        placeholder="List items here (one per line)..."
                                        rows={3}
                                    />
                                )}

                                {q.answer_type === "dropdown" && (
                                    <Select
                                        value={answers[q.id] ?? ""}
                                        onValueChange={(value) => setAnswers({ ...answers, [q.id]: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select option" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(q.dropdown_options ?? []).map((option, idx) => (
                                                <SelectItem key={idx} value={option}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}

                                {q.answer_type === "counting_timer" && (
                                    <CountingTimerInput
                                        value={answers[q.id] || ""}
                                        onChange={(val) => setAnswers({ ...answers, [q.id]: val })}
                                    />
                                )}
                            </div>
                        ))
                    )}
                </div>

                <DialogFooter className="mt-4 pt-4 border-t border-border/30">
                    <Button onClick={() => onOpenChange(false)} variant="outline">Cancel</Button>
                    <Button onClick={handleSubmit} disabled={submitting} className="min-w-[100px]">
                        {submitting ? "..." : "Submit"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

