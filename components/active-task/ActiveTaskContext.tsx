"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { pushToast } from "@/components/ui/toast";

type SessionType = "pomodoro" | "short_break" | "long_break" | "deep_work";

export type ActiveTaskSession = {
  taskId: string;
  title: string;
  sessionType: SessionType;
  startedAt: string;
  totalSeconds: number;
  secondsLeft: number;
  running: boolean;
  interruptions: number;
};

type StartPayload = {
  taskId: string;
  title: string;
  sessionType?: SessionType;
  durationMinutes?: number;
};

type ActiveTaskContextValue = {
  session: ActiveTaskSession | null;
  startTask: (payload: StartPayload) => void;
  pauseTask: () => void;
  resumeTask: () => void;
  stopTask: () => void;
  clearTask: () => void;
};

const STORAGE_KEY = "laag-active-task-session-v1";

const ActiveTaskContext = createContext<ActiveTaskContextValue | null>(null);

export function ActiveTaskProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ActiveTaskSession | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ActiveTaskSession;
      if (parsed?.taskId && parsed?.title) {
        setSession(parsed);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    if (!session?.running) return;
    const timerId = window.setInterval(() => {
      setSession((current) => {
        if (!current) return null;
        if (!current.running) return current;
        const next = current.secondsLeft - 1;
        if (next <= 0) {
          pushToast("Complete", `${current.title} finished.`);
          return null;
        }
        return { ...current, secondsLeft: next };
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [session?.running]);

  const value = useMemo<ActiveTaskContextValue>(
    () => ({
      session,
      startTask: ({ taskId, title, sessionType = "pomodoro", durationMinutes = 25 }) => {
        setSession({
          taskId,
          title,
          sessionType,
          startedAt: new Date().toISOString(),
          totalSeconds: durationMinutes * 60,
          secondsLeft: durationMinutes * 60,
          running: true,
          interruptions: 0
        });
        pushToast("Start", `${title} started.`);
      },
      pauseTask: () => {
        setSession((current) =>
          current
            ? { ...current, running: false, interruptions: current.interruptions + 1 }
            : current
        );
      },
      resumeTask: () => {
        setSession((current) => (current ? { ...current, running: true } : current));
      },
      stopTask: () => {
        setSession(null);
      },
      clearTask: () => {
        setSession(null);
      }
    }),
    [session]
  );

  return <ActiveTaskContext.Provider value={value}>{children}</ActiveTaskContext.Provider>;
}

export function useActiveTask() {
  const context = useContext(ActiveTaskContext);
  if (!context) {
    throw new Error("useActiveTask must be used inside ActiveTaskProvider");
  }
  return context;
}
