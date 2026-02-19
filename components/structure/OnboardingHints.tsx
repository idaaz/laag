"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type HintStep = {
  id: string;
  target: string;
  caption: string;
};

const defaultSteps: HintStep[] = [
  { id: "create-task", target: "Tasks", caption: "Create your first task in one tap." },
  { id: "start-work", target: "Start", caption: "Start a deep-work timer when ready." },
  { id: "log-complete", target: "Log", caption: "Log completion to lock your streak." }
];

type OnboardingHintsProps = {
  storageKey?: string;
  steps?: HintStep[];
};

export function OnboardingHints({
  storageKey = "laag-ui-hints-dismissed-v1",
  steps = defaultSteps
}: OnboardingHintsProps) {
  const [dismissed, setDismissed] = useState(false);
  const [visibleIndex, setVisibleIndex] = useState(0);

  const orderedSteps = useMemo(() => steps.slice(0, 3), [steps]);

  useEffect(() => {
    if (localStorage.getItem(storageKey)) {
      setDismissed(true);
      return;
    }
    const timers = orderedSteps.map((_, index) =>
      setTimeout(() => setVisibleIndex(index), index * 900)
    );
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [orderedSteps, storageKey]);

  if (dismissed) return null;

  return (
    <aside
      className="rounded-xl border border-primary/35 bg-primary/10 p-3"
      aria-label="Onboarding hints"
      role="status"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold">Quick start</p>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(storageKey, "1");
            setDismissed(true);
          }}
          className="rounded-md p-1 text-muted-foreground hover:bg-primary/15 hover:text-foreground"
          aria-label="Dismiss"
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 space-y-2">
        {orderedSteps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "rounded-md border border-primary/20 px-2 py-1 text-xs",
              "transition-all duration-[220ms] ease-out motion-reduce:transition-none",
              visibleIndex >= index ? "translate-y-0 opacity-100" : "translate-y-1 opacity-45"
            )}
          >
            <span className="font-semibold">{step.target}:</span> {step.caption}
          </div>
        ))}
      </div>
    </aside>
  );
}
