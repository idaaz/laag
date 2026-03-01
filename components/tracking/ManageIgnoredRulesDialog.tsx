"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useTracking } from "@/hooks/useTracking";
import { Trash2, Loader2, ShieldX, Plus } from "lucide-react";

interface ManageIgnoredRulesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ManageIgnoredRulesDialog({ open, onOpenChange }: ManageIgnoredRulesDialogProps) {
    const { user } = useAuth();
    const { ignoredRulesQuery, createIgnoredRule, deleteIgnoredRule } = useTracking(user?.id);

    const [newPattern, setNewPattern] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const rules = ignoredRulesQuery.data || [];

    const handleAddRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPattern.trim()) {
            setError("Please provide a URL pattern or prefix.");
            return;
        }
        setError(null);
        setIsSubmitting(true);
        try {
            await createIgnoredRule.mutateAsync({ urlPattern: newPattern.trim() });
            setNewPattern("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create rule");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteRule = async (id: string) => {
        try {
            await deleteIgnoredRule.mutateAsync(id);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] border-border/60 bg-background/95 backdrop-blur-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-full bg-destructive/10 text-destructive">
                            <ShieldX className="h-4 w-4" />
                        </div>
                        <DialogTitle>Ignored Tracking Rules</DialogTitle>
                    </div>
                    <DialogDescription>
                        URLs matching these patterns will be completely ignored by the tracker.
                        Useful for blocking specific YouTube categories or private sites.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 flex flex-col gap-6">
                    <form onSubmit={handleAddRule} className="flex flex-col gap-3 rounded-lg border border-border/40 p-4 bg-secondary/10">
                        <div className="space-y-2">
                            <Label htmlFor="url-pattern">URL Prefix / Pattern</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="url-pattern"
                                    placeholder="e.g. youtube.com/shorts"
                                    value={newPattern}
                                    onChange={(e) => setNewPattern(e.target.value)}
                                    className="h-9"
                                />
                                <Button type="submit" size="sm" className="h-9 px-4" disabled={isSubmitting || !newPattern.trim()}>
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        {error && <p className="text-xs text-destructive font-medium">{error}</p>}
                    </form>

                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground flex items-center justify-between">
                            Active Blocklist
                            <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full">{rules.length}</span>
                        </h4>

                        <div className="max-h-[200px] overflow-y-auto pr-2 laag-scroll space-y-2">
                            {ignoredRulesQuery.isLoading ? (
                                <div className="flex items-center justify-center p-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
                                </div>
                            ) : rules.length === 0 ? (
                                <div className="text-center py-8 border border-dashed border-border/40 rounded-lg">
                                    <p className="text-xs text-muted-foreground">No URLs are currently ignored.</p>
                                </div>
                            ) : (
                                rules.map((rule) => (
                                    <div
                                        key={rule.id}
                                        className="flex items-center justify-between p-3 rounded-md border border-border/40 bg-card/40 group"
                                    >
                                        <code className="text-xs font-mono text-primary truncate max-w-[300px]" title={rule.url_pattern}>
                                            {rule.url_pattern}
                                        </code>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDeleteRule(rule.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
