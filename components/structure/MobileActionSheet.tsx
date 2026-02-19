"use client";

import {
    Sheet,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QuickAction } from "@/components/structure/QuickActionBar";

type MobileActionSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    actions: QuickAction[];
};

export function MobileActionSheet({ open, onOpenChange, actions }: MobileActionSheetProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange} side="bottom">
            <div className="px-4 pb-8 pt-4">
                <SheetHeader className="text-left mb-4">
                    <SheetTitle>Actions</SheetTitle>
                    <SheetDescription>
                        Quick access to common tasks.
                    </SheetDescription>
                </SheetHeader>
                <div className="grid grid-cols-1 gap-2">
                    {actions.map((action) => (
                        <Button
                            key={action.id}
                            variant="outline"
                            className={cn(
                                "w-full justify-start gap-3 h-12 text-base font-normal",
                                action.disabled && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => {
                                action.onRun();
                                onOpenChange(false);
                            }}
                            disabled={action.disabled}
                        >
                            {action.icon && <span className="h-5 w-5">{action.icon}</span>}
                            <span>{action.label}</span>
                        </Button>
                    ))}
                </div>
            </div>
        </Sheet>
    );
}
