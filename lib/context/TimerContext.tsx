"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
    ReactNode
} from "react";
import {
    SESSION_DURATIONS_SECONDS,
    DashboardSessionType,
} from "@/lib/timer/dashboardTimer";

// Define the shape of our timer state
type TimerState = {
    sessionType: DashboardSessionType;
    secondsLeft: number;
    running: boolean;
    baseDuration: number;
    interruptions: number;
    activeTaskId: string | null; // ID of the task being tracked (if any)
    activeTaskTitle: string | null; // Title of the task for display
};

// Define the actions available to consumers
type TimerActions = {
    start: () => void;
    pause: () => void;
    stop: () => void;
    setSessionType: (type: DashboardSessionType) => void;
    setActiveTask: (taskId: string | null, title?: string) => void;
    addInterruption: () => void;
};

type TimerContextType = TimerState & TimerActions;

const TimerContext = createContext<TimerContextType | null>(null);

const STORAGE_KEY = "laag-global-timer";

const DEFAULT_STATE: TimerState = {
    sessionType: "pomodoro",
    secondsLeft: SESSION_DURATIONS_SECONDS.pomodoro,
    running: false,
    baseDuration: SESSION_DURATIONS_SECONDS.pomodoro,
    interruptions: 0,
    activeTaskId: null,
    activeTaskTitle: null
};

export function TimerProvider({ children }: { children: ReactNode }) {
    // Initialize state from localStorage if available, otherwise default
    const [state, setState] = useState<TimerState>(() => {
        if (typeof window === "undefined") return DEFAULT_STATE;
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Basic validation/migration could go here
                return { ...DEFAULT_STATE, ...parsed };
            }
        } catch (e) {
            console.error("Failed to parsing timer state", e);
        }
        return DEFAULT_STATE;
    });

    const intervalRef = useRef<number | null>(null);
    const lastTickRef = useRef<number>(Date.now());

    // Persistence effect: Save state to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    // Timer Tick Logic
    useEffect(() => {
        if (state.running) {
            lastTickRef.current = Date.now();

            intervalRef.current = window.setInterval(() => {
                const now = Date.now();
                const delta = Math.floor((now - lastTickRef.current) / 1000);

                if (delta >= 1) {
                    setState((prev) => {
                        const nextSeconds = Math.max(0, prev.secondsLeft - delta);

                        // Auto-stop when reaching 0
                        if (nextSeconds === 0) {
                            // TODO: Play sound / Notification here
                            return { ...prev, running: false, secondsLeft: 0 };
                        }

                        return { ...prev, secondsLeft: nextSeconds };
                    });
                    lastTickRef.current = now;
                }
            }, 1000);
        } else {
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
            }
        };
    }, [state.running]);

    // Actions
    const start = useCallback(() => setState((prev) => ({ ...prev, running: true })), []);

    const pause = useCallback(() => setState((prev) => ({ ...prev, running: false })), []);

    const stop = useCallback(() => {
        setState((prev) => ({
            ...prev,
            running: false,
            secondsLeft: prev.baseDuration,
            interruptions: 0
        }));
    }, []);

    const setSessionType = useCallback((type: DashboardSessionType) => {
        const duration = SESSION_DURATIONS_SECONDS[type];
        setState((prev) => ({
            ...prev,
            sessionType: type,
            baseDuration: duration,
            secondsLeft: duration, // Reset timer on type change
            running: false,
            interruptions: 0
        }));
    }, []);

    const setActiveTask = useCallback((taskId: string | null, title?: string) => {
        setState(prev => ({ ...prev, activeTaskId: taskId, activeTaskTitle: title || null }));
    }, []);

    const addInterruption = useCallback(() => {
        setState(prev => ({ ...prev, interruptions: prev.interruptions + 1 }));
    }, []);


    const value = {
        ...state,
        start,
        pause,
        stop,
        setSessionType,
        setActiveTask,
        addInterruption
    };

    return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
    const context = useContext(TimerContext);
    if (!context) {
        throw new Error("useTimer must be used within a TimerProvider");
    }
    return context;
}
