"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ToastMessage = {
  id: string;
  title: string;
  description?: string;
  variant?: "primary" | "success" | "warning" | "danger";
};

let listeners: ((messages: ToastMessage[]) => void)[] = [];
let messages: ToastMessage[] = [];

function emit() {
  listeners.forEach((listener) => listener(messages));
}

export function pushToast(title: string, description?: string) {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);
  const item = { id, title, description, variant: "success" as const };
  messages = [...messages, item];
  emit();
  setTimeout(() => {
    messages = messages.filter((message) => message.id !== item.id);
    emit();
  }, 3200);
}

export function ToastViewport() {
  const [state, setState] = useState<ToastMessage[]>([]);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      listeners = listeners.filter((listener) => listener !== setState);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[70] space-y-2"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {state.map((message) => (
        <div
          key={message.id}
          className={cn(
            "pointer-events-auto w-80 rounded-lg border p-3 shadow-lg micro-toast-enter",
            message.variant === "warning" && "border-warning/50 bg-warning/10",
            message.variant === "danger" && "border-destructive/50 bg-destructive/10",
            message.variant === "success" && "border-success/50 bg-success/10",
            (!message.variant || message.variant === "primary") && "border-primary/50 bg-primary/10"
          )}
        >
          <p className="text-sm font-semibold">{message.title}</p>
          {message.description ? (
            <p className="text-xs text-muted-foreground">{message.description}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
