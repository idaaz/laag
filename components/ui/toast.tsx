"use client";

import { useEffect, useState } from "react";

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

import { createNotification } from "@/lib/engines/notificationEngine";
import { useAuth } from "@/hooks/useAuth";
import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function ToastViewport() {
  const [state, setState] = useState<ToastMessage[]>([]);
  const { user } = useAuth();
  const seenIds = useRef(new Set<string>());
  const queryClient = useQueryClient();

  useEffect(() => {
    listeners.push(setState);
    return () => {
      listeners = listeners.filter((listener) => listener !== setState);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    let hasNew = false;
    state.forEach(msg => {
      if (!seenIds.current.has(msg.id)) {
        seenIds.current.add(msg.id);
        hasNew = true;
        // Pipe into notification engine Instead of displaying toast
        createNotification({
          userId: user.id,
          type: "system",
          title: msg.title,
          message: msg.description || "",
        }).catch(console.error);
      }
    });

    if (hasNew) {
      // Invalidate notifications query to refresh the popover
      queryClient.invalidateQueries({ queryKey: ["app_notifications"] });
    }
  }, [state, user, queryClient]);

  // Return null because we no longer want the bottom-right banner
  return null;
}
