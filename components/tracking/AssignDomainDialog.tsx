"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTracking } from "@/hooks/useTracking";


export function AssignDomainDialog({
    domain,
    open,
    onOpenChange
}: {
    domain: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { user } = useAuth();
    const { categoriesQuery, assignDomain } = useTracking(user?.id);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const customCategories = categoriesQuery.data ?? [];

    if (!domain) return null;

    async function handleAssign(categoryId: string | null) {
        setIsSubmitting(true);
        try {
            // If categoryId is null, it's a default category, so they just delete the override or something.
            // Wait, our backend currently only links to custom categories. 
            // It doesn't allow overriding to a *different* default category unless we add it as a custom category first.
            // Let's create a custom category silently if they select a default one, or just handle custom categories.

            if (!categoryId) {
                // We're assigning to a default category. Since our DB links to tracking_categories by ID,
                // we might actually need to create a custom category with that name if it doesn't exist,
                // or just let them manage custom ones.
                return;
            }

            await assignDomain.mutateAsync({ domain: domain!, categoryId });
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to assign domain:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-primary" />
                        Assign Category
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                        Choose a custom category for{" "}
                        <span className="font-mono font-medium text-foreground">{domain}</span>
                    </p>
                </DialogHeader>

                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                    {categoriesQuery.isLoading ? (
                        <div className="text-sm text-muted-foreground">Loading categories...</div>
                    ) : customCategories.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-4 bg-muted/20 rounded-md">
                            No custom categories found.<br />
                            Create one first from the Insights section.
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Custom Categories</h4>
                            {customCategories.map((c) => (
                                <Button
                                    key={c.id}
                                    variant="outline"
                                    className="justify-start hidden md:flex"
                                    onClick={() => handleAssign(c.id)}
                                    disabled={isSubmitting}
                                >
                                    <span
                                        className="w-3 h-3 rounded-full mr-3 shrink-0"
                                        style={{ backgroundColor: c.color }}
                                    />
                                    {c.name}
                                </Button>
                            ))}

                            {/* Mobile layout fix */}
                            <div className="md:hidden flex flex-col gap-2">
                                {customCategories.map((c) => (
                                    <Button
                                        key={c.id}
                                        variant="outline"
                                        className="justify-start flex"
                                        onClick={() => handleAssign(c.id)}
                                        disabled={isSubmitting}
                                    >
                                        <span
                                            className="w-3 h-3 rounded-full mr-3 shrink-0"
                                            style={{ backgroundColor: c.color }}
                                        />
                                        {c.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
