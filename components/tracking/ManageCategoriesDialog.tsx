"use client";

import { useState } from "react";
import { Plus, Tag } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useTracking } from "@/hooks/useTracking";

const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--success))",
    "hsl(var(--warning))",
    "hsl(var(--destructive))",
];

export function ManageCategoriesDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const { user } = useAuth();
    const { categoriesQuery, createCategory } = useTracking(user?.id);
    const [name, setName] = useState("");
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = categoriesQuery.data ?? [];

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            await createCategory.mutateAsync({ name: name.trim(), color: selectedColor });
            setName("");
            // Don't close immediately so they can see it added
        } catch (error) {
            console.error("Failed to create category:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Tag className="w-5 h-5 text-primary" />
                        Manage Categories
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Existing Categories</h4>
                        {categoriesQuery.isLoading ? (
                            <div className="text-sm text-muted-foreground">Loading...</div>
                        ) : categories.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No custom categories yet.</div>
                        ) : (
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2">
                                {categories.map((c) => (
                                    <div key={c.id} className="flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-3 py-1.5 text-xs font-medium">
                                        <span
                                            className="inline-block w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: c.color }}
                                        />
                                        {c.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleCreate} className="space-y-4 pt-4 border-t border-border/40">
                        <h4 className="text-sm font-medium text-foreground">Create New Category</h4>
                        <div className="grid gap-2">
                            <Label htmlFor="category-name">Name</Label>
                            <Input
                                id="category-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Research"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Color</Label>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        className={`w-8 h-8 rounded-full border-2 transition-transform ${selectedColor === c ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => setSelectedColor(c)}
                                        aria-label={`Select color ${c}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting || !name.trim()}>
                            {isSubmitting ? "Creating..." : (
                                <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Category
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
