"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Play, Plus } from "lucide-react";
import { pushToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type FlowState = {
  taskName: string;
  taskCreated: boolean;
  timerStarted: boolean;
  logged: boolean;
};

const initialState: FlowState = {
  taskName: "",
  taskCreated: false,
  timerStarted: false,
  logged: false
};

export function CreateStartLogPrototype() {
  const [state, setState] = useState<FlowState>(initialState);
  const [liveMessage, setLiveMessage] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const progress = useMemo(() => {
    let value = 0;
    if (state.taskCreated) value += 33;
    if (state.timerStarted) value += 33;
    if (state.logged) value += 34;
    return value;
  }, [state.logged, state.taskCreated, state.timerStarted]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!state.taskName.trim()) return;
    if (!reducedMotion) await new Promise((resolve) => setTimeout(resolve, 160));
    setState((current) => ({ ...current, taskCreated: true }));
    pushToast("Create", "Task added.");
    setLiveMessage(`Task created: ${state.taskName}.`);
  }

  async function handleStart() {
    if (!state.taskCreated) return;
    if (!reducedMotion) await new Promise((resolve) => setTimeout(resolve, 160));
    setState((current) => ({ ...current, timerStarted: true }));
    pushToast("Start", "Deep work active.");
    setLiveMessage("Pomodoro started, 25 minutes.");
  }

  async function handleLog() {
    if (!state.timerStarted) return;
    if (!reducedMotion) await new Promise((resolve) => setTimeout(resolve, 160));
    setState((current) => ({ ...current, logged: true }));
    pushToast("Log", "Completion saved.");
    setLiveMessage("Completion logged.");
  }

  return (
    <section className="space-y-3">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Prototype Flow</h2>
        <p className="text-sm text-muted-foreground">Create -&gt; Start -&gt; Log</p>
      </header>

      <article className="rounded-xl border border-border/80 bg-card/85 p-3 space-y-3">
        <form className="flex flex-col sm:flex-row gap-2" onSubmit={handleCreate}>
          <input
            value={state.taskName}
            onChange={(event) => setState((current) => ({ ...current, taskName: event.target.value }))}
            className="flex-1 h-10 rounded-lg border border-input bg-background px-3 text-sm"
            placeholder="Task name"
            aria-label="Task name"
          />
          <button
            type="submit"
            className={cn(
              "h-10 rounded-lg border px-3 inline-flex items-center justify-center gap-2",
              "transition-all duration-[160ms] ease-[var(--ease-soft)] motion-reduce:transition-none",
              "active:scale-[0.97]",
              "border-primary bg-primary text-primary-foreground"
            )}
          >
            <Plus className="h-4 w-4" />
            Create
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleStart}
            disabled={!state.taskCreated}
            className={cn(
              "h-10 rounded-lg border px-3 inline-flex items-center justify-center gap-2",
              "transition-all duration-[160ms] ease-[var(--ease-soft)] motion-reduce:transition-none",
              "active:scale-[0.97] disabled:opacity-45 disabled:cursor-not-allowed",
              state.timerStarted ? "border-success bg-success text-white" : "border-border bg-background"
            )}
          >
            <Play className="h-4 w-4" />
            Start
          </button>
          <button
            type="button"
            onClick={handleLog}
            disabled={!state.timerStarted}
            className={cn(
              "h-10 rounded-lg border px-3 inline-flex items-center justify-center gap-2",
              "transition-all duration-[160ms] ease-[var(--ease-soft)] motion-reduce:transition-none",
              "active:scale-[0.97] disabled:opacity-45 disabled:cursor-not-allowed",
              state.logged ? "border-success bg-success text-white" : "border-border bg-background"
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            Log
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Progress</p>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-[width] duration-[300ms] linear motion-reduce:transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {liveMessage}
        </p>
      </article>
    </section>
  );
}
