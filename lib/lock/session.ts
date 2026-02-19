"use client";

import { isBrowser } from "@/lib/utils";

const LOCK_KEY = "laag-lock-session";

export type LockSessionState = {
  encryptedToken: string;
  expiresAt: string;
};

export function setLockSession(state: LockSessionState) {
  if (!isBrowser()) return;
  localStorage.setItem(LOCK_KEY, JSON.stringify(state));
}

export function getLockSession(): LockSessionState | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(LOCK_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LockSessionState;
  } catch {
    return null;
  }
}

export function clearLockSession() {
  if (!isBrowser()) return;
  localStorage.removeItem(LOCK_KEY);
}

export function isLockSessionExpired(session: LockSessionState | null): boolean {
  if (!session) return true;
  return new Date(session.expiresAt).getTime() <= Date.now();
}
