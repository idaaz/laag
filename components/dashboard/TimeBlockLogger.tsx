"use client";

import { useState } from "react";
import { Brain, GraduationCap, Sword, Dumbbell, PlayCircle, PauseCircle, Trash2, Music, ClipboardList, CheckCircle2, XCircle, Zap, Flame, Terminal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";


const CATEGORIES = [
    { id: "Deep Work", icon: Brain, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { id: "Education", icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-500/10" },
    { id: "Skill", icon: Sword, color: "text-amber-500", bg: "bg-amber-500/10" },
    { id: "Musical Work", icon: Music, color: "text-indigo-400", bg: "bg-indigo-400/10" },
    { id: "Daily Work", icon: ClipboardList, color: "text-cyan-500", bg: "bg-cyan-500/10" },
    { id: "Health", icon: Dumbbell, color: "text-orange-500", bg: "bg-orange-500/10" },
    { id: "Entertainment", icon: PlayCircle, color: "text-pink-500", bg: "bg-pink-500/10" },
    { id: "Break", icon: PauseCircle, color: "text-slate-500", bg: "bg-slate-500/10" },
    { id: "Wasted", icon: Trash2, color: "text-rose-500", bg: "bg-rose-500/10" },
] as const;

const SUGGESTIONS = ["Coding", "Reading", "Meeting", "Deep Work", "Workout", "Rest", "Doom Scrolling"];

interface TimeBlockLoggerProps {
    onSave: (data: {
        activity: string;
        category: typeof CATEGORIES[number]["id"];
        is_planned: boolean;
        energy_level: number;
        output_notes: string;
    }) => Promise<void>;
    isLoading?: boolean;
}

export function TimeBlockLogger({ onSave, isLoading }: TimeBlockLoggerProps) {
    const [activity, setActivity] = useState("");
    const [category, setCategory] = useState<typeof CATEGORIES[number]["id"]>("Deep Work");
    const [isPlanned, setIsPlanned] = useState(true);
    const [energy, setEnergy] = useState(3);
    const [notes, setNotes] = useState("");

    // Time block calculation (current 30 min window)
    const now = new Date();
    const minutes = now.getMinutes();
    const startMins = minutes < 30 ? 0 : 30;
    const endMins = minutes < 30 ? 30 : 0;

    const startTimeStr = `${now.getHours().toString().padStart(2, '0')}:${startMins.toString().padStart(2, '0')}`;
    const endHour = minutes < 30 ? now.getHours() : (now.getHours() + 1) % 24;
    const endTimeStr = `${endHour.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

    const handleSave = async () => {
        if (!activity.trim()) return;
        try {
            await onSave({
                activity,
                category,
                is_planned: isPlanned,
                energy_level: energy,
                output_notes: notes
            });
            // Reset form
            setActivity("");
            setNotes("");
        } catch (error) {
            // Error is handled by the parent mutation usually, 
            // but we catch here just in case to prevent UI crashes
            console.error("TimeBlockLogger: Failed to save:", error);
        }
    };

    return (
        <Card className="border-primary/20 bg-secondary/5 overflow-hidden shadow-2xl transition-all duration-300 hover:border-primary/40">
            <CardContent className="p-6 space-y-6">
                {/* Header - Current Window */}
                <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <h2 className="text-sm font-mono font-bold text-primary/80 uppercase tracking-widest">
                            {startTimeStr} — {endTimeStr} Block
                        </h2>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono uppercase">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                </div>

                {/* Question Area */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-lg font-medium">How did you spend this block?</Label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">
                                <Terminal className="w-4 h-4" />
                            </div>
                            <Input
                                value={activity}
                                onChange={(e) => setActivity(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                placeholder="Enter activity..."
                                className="h-12 pl-10 text-lg bg-background/50 border-primary/20 focus:border-primary focus:ring-primary/20 transition-all placeholder:opacity-50"
                            />
                            <div className="flex flex-wrap gap-2 mt-2">
                                {SUGGESTIONS.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setActivity(s)}
                                        className="text-[10px] px-2 py-1 rounded bg-secondary/50 border border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all text-muted-foreground hover:text-primary"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Controls Grid */}
                    <div className="grid md:grid-cols-5 gap-6 pt-2">
                        {/* Category Selector */}
                        <div className="md:col-span-3 space-y-3">
                            <Label className="text-xs font-mono text-muted-foreground uppercase">Context</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setCategory(cat.id)}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg border transition-all duration-200",
                                            category === cat.id
                                                ? cn("border-primary bg-primary/5 shadow-inner scale-105", cat.color)
                                                : "border-border/50 bg-secondary/20 grayscale opacity-60 hover:opacity-100 hover:grayscale-0"
                                        )}
                                    >
                                        <cat.icon className="w-4 h-4" />
                                        <span className="text-[9px] font-medium leading-tight text-center">{cat.id}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right Column: Intent & Energy */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="space-y-3">
                                <Label className="text-xs font-mono text-muted-foreground uppercase">Accountability Check</Label>
                                <div className="flex gap-2">
                                    <Button
                                        variant={isPlanned ? "default" : "outline"}
                                        className={cn("flex-1 h-10 px-1 gap-1", isPlanned && "bg-emerald-600 hover:bg-emerald-700")}
                                        onClick={() => setIsPlanned(true)}
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span className="text-[10px] uppercase font-bold tracking-tighter">Intentional</span>
                                    </Button>
                                    <Button
                                        variant={!isPlanned ? "default" : "outline"}
                                        className={cn("flex-1 h-10 px-1 gap-1", !isPlanned && "bg-rose-600 hover:bg-rose-700")}
                                        onClick={() => setIsPlanned(false)}
                                    >
                                        <XCircle className="w-3.5 h-3.5" />
                                        <span className="text-[10px] uppercase font-bold tracking-tighter">Distracted</span>
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-mono text-muted-foreground uppercase">Energy Level</Label>
                                    <span className="text-xs font-bold text-primary">{energy === 5 ? "🔥 PEAK" : energy === 1 ? "😴 LOW" : `${energy}/5`}</span>
                                </div>
                                <div className="flex items-center gap-3 px-1">
                                    <Zap className={cn("w-4 h-4 transition-colors", energy < 3 ? "text-slate-400" : "text-yellow-500")} />
                                    <Slider
                                        value={[energy]}
                                        onValueChange={([v]) => setEnergy(v)}
                                        min={1}
                                        max={5}
                                        step={1}
                                        className="flex-1"
                                    />
                                    <Flame className={cn("w-4 h-4 transition-colors", energy > 4 ? "text-orange-500" : "text-slate-400")} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Micro Journal */}
                    <div className="pt-2 border-t border-border/30 space-y-3">
                        <Label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Micro Journal / Blockers</Label>
                        <div className="animate-in fade-in duration-500">
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Any blockers or insights?"
                                className="min-h-[80px] bg-secondary/10 border-border/50 text-sm italic focus:bg-secondary/20 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <Button
                    onClick={handleSave}
                    disabled={!activity.trim() || isLoading}
                    className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground font-bold text-lg shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                    {isLoading ? "Logging..." : "SAVE LOG (Enter)"}
                </Button>
            </CardContent>
        </Card>
    );
}
