"use client";

import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  SESSION_DURATIONS_SECONDS,
  type DashboardSessionType
} from "@/lib/timer/dashboardTimer";
import { useTimer } from "@/lib/context/TimerContext";
import { useAuth } from "@/hooks/useAuth";

const SESSION_LABELS = {
  pomodoro: "Pomodoro",
  short_break: "Break",
  long_break: "Long",
  deep_work: "Deep"
} as const;


type SessionType = DashboardSessionType;




export function PomodoroTimer({
  onCompleted,
  onStateChange
}: {
  onCompleted: (payload: {
    sessionType: SessionType;
    startedAt: string;
    endedAt: string;
    durationMinutes: number;
  }) => Promise<void>;
  onStateChange?: (message: string) => void;
}) {
  const {
    sessionType,
    secondsLeft,
    running,
    baseDuration,
    interruptions,
    start,
    pause,
    stop,
    setSessionType,
    setCustomDuration,
    addInterruption
  } = useTimer();

  const { user } = useAuth();

  // Local effect to handle completion logic which is specific to this view for now
  // In a future step, this could also move to context or a custom hook if needed globally
  useEffect(() => {
    if (secondsLeft === 0 && running === false && baseDuration > 0) {
      // This is a rough check for "just finished".
      // The context stops running at 0.
      // We might need a better "completed" flag in context.
      // For now, let's just trigger the completion if it hits 0.
      const durationMinutes = Math.round(baseDuration / 60);
      const now = new Date();
      const startedAt = new Date(now.getTime() - baseDuration * 1000).toISOString(); // Approximate

      onCompleted({
        sessionType,
        startedAt,
        endedAt: now.toISOString(),
        durationMinutes
      });

      // Trigger achievement check
      if (user?.id) {
        fetch("/api/achievements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id })
        }).catch(console.error);
      }
    }
  }, [secondsLeft, running, baseDuration, sessionType, onCompleted, user?.id]);

  const mmss = useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [secondsLeft]);

  const progress = useMemo(() => {
    const total = baseDuration || SESSION_DURATIONS_SECONDS[sessionType];
    const done = total - secondsLeft;
    return Math.min(100, Math.max(0, (done / total) * 100));
  }, [sessionType, secondsLeft, baseDuration]);

  // Actions now just call context
  const handleStart = () => {
    start();
    onStateChange?.(`${SESSION_LABELS[sessionType]} started.`);
  };

  const handlePause = () => {
    pause();
    addInterruption();
    onStateChange?.(`${SESSION_LABELS[sessionType]} paused.`);
  };

  const handleStop = () => {
    stop();
    onStateChange?.(`${SESSION_LABELS[sessionType]} stopped.`);
  };

  return (
    <Card className="border-primary/35 bg-card/90">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Deep Work</span>
          <span
            className={cn(
              "inline-flex h-2 w-2 rounded-full",
              running ? "bg-success animate-pulse" : "bg-muted"
            )}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Session type">
          {(Object.keys(SESSION_DURATIONS_SECONDS) as SessionType[]).map((type) => (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={sessionType === type}
              onClick={() => setSessionType(type)}
              className={cn(
                "rounded-md border px-2 py-1 text-xs",
                "transition-colors duration-[200ms] ease-[var(--ease-soft)] motion-reduce:transition-none",
                sessionType === type
                  ? "border-primary bg-primary/12 text-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary"
              )}
            >
              {SESSION_LABELS[type]}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] uppercase font-bold border-primary/20 hover:border-primary/50"
                onClick={() => setCustomDuration(25)}
                disabled={running}
              >
                25m
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] uppercase font-bold border-primary/20 hover:border-primary/50"
                onClick={() => setCustomDuration(50)}
                disabled={running}
              >
                50m
              </Button>
            </div>
            <div className="flex-1 max-w-[140px] space-y-1">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted-foreground/70 mb-1">
                <span>Custom</span>
                <span className="text-primary">{Math.round(baseDuration / 60)}m</span>
              </div>
              <input
                type="range"
                min={1}
                max={60}
                step={1}
                value={Math.round(baseDuration / 60)}
                onChange={(e) => setCustomDuration(Number(e.target.value))}
                disabled={running}
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all opacity-80 hover:opacity-100"
                aria-label="Custom duration (minutes)"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 py-2">
          <p className="text-6xl font-mono font-bold tracking-tight text-center tabular-nums text-foreground drop-shadow-sm">{mmss}</p>
          <div className="h-2.5 w-full rounded-full bg-secondary/50 overflow-hidden border border-border/10">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-linear",
                running ? "bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.4)]" : "bg-muted-foreground/30"
              )}
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              aria-label="Timer progress"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!running ? (
            <Button onClick={handleStart} disabled={secondsLeft === 0} className="flex-1" aria-label="Start timer">
              Start
            </Button>
          ) : (
            <Button variant="outline" onClick={handlePause} className="flex-1" aria-label="Pause timer">
              Pause
            </Button>
          )}
          <Button variant="ghost" onClick={handleStop} className="flex-1" aria-label="Stop timer">
            Stop
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Interruptions: {interruptions}</p>
      </CardContent>
    </Card>
  );
}
