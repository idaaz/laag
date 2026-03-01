"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useTracking } from "@/hooks/useTracking";
import { Trash2, Loader2, MousePointerClick } from "lucide-react";
import { TrackingCustomRuleRow } from "@/lib/supabase/types";

interface ManageCustomRulesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectRule: (rule: TrackingCustomRuleRow) => void;
}

export function ManageCustomRulesDialog({ open, onOpenChange, onSelectRule }: ManageCustomRulesDialogProps) {
    const { user } = useAuth();
    const { customRulesQuery, createCustomRule, deleteCustomRule } = useTracking(user?.id);

    const [newPrefix, setNewPrefix] = useState("");
    const [newName, setNewName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const rules = customRulesQuery.data || [];

    const handleAddRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPrefix.trim() || !newName.trim()) {
            setError("Please provide both a prefix and a name.");
            return;
        }
        setError(null);
        setIsSubmitting(true);
        try {
            await createCustomRule.mutateAsync({ urlPrefix: newPrefix.trim(), name: newName.trim() });
            setNewPrefix("");
            setNewName("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create rule");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteRule = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // prevent triggering the select action
        try {
            await deleteCustomRule.mutateAsync(id);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSelectRule = (rule: TrackingCustomRuleRow) => {
        onSelectRule(rule);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] border-border/60 bg-background/95 backdrop-blur-md overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Custom Tracking Rules</DialogTitle>
                    <DialogDescription>
                        Create rules based on URL prefixes to filter your browsing history easily. Click a rule to apply the filter.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 flex flex-col gap-6">
                    <form onSubmit={handleAddRule} className="flex flex-col gap-3 rounded-lg border border-border/40 p-3 bg-secondary/10">
                        <h4 className="text-sm font-medium mb-1">Add New Rule</h4>
                        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                            <div className="space-y-1">
                                <Label htmlFor="url-prefix" className="text-xs">URL Prefix</Label>
                                <Input
                                    id="url-prefix"
                                    placeholder="https://www.youtube.com/watch?"
                                    value={newPrefix}
                                    onChange={(e) => setNewPrefix(e.target.value)}
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="rule-name" className="text-xs">Rule Name</Label>
                                <Input
                                    id="rule-name"
                                    placeholder="Long form video"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="h-8 text-xs"
                                />
                            </div>
                            <Button type="submit" size="sm" className="h-8" disabled={isSubmitting || !newPrefix || !newName}>
                                {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
                            </Button>
                        </div>
                        {error && <p className="text-xs text-[var(--k-red)] font-medium">{error}</p>}
                    </form>

                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 laag-scroll">
                        <h4 className="text-sm font-medium mb-2 sticky top-0 bg-background/95 py-1 z-10">Your Rules</h4>
                        {customRulesQuery.isLoading ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        ) : rules.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center p-4">You don&apos;t have any custom rules yet.</p>
                        ) : (
                            <ul className="space-y-2">
                                {rules.map((rule) => (
                                    <li
                                        key={rule.id}
                                        className="flex flex-col gap-1 p-2 rounded-md border border-border/40 bg-card hover:bg-secondary/40 cursor-pointer transition-colors group"
                                        onClick={() => handleSelectRule(rule)}
                                        title="Click to filter by this rule"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-sm font-semibold truncate text-primary">{rule.name}</span>
                                                <span className="text-xs text-muted-foreground truncate">{rule.url_prefix}</span>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                <div className="text-[10px] uppercase text-muted-foreground flex items-center mr-2"><MousePointerClick className="w-3 h-3 mr-1" /> Filter</div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    onClick={(e) => handleDeleteRule(e, rule.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
