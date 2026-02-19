"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserRow } from "@/lib/supabase/types";

export function useAuth() {
  // Mock user for open access (real admin user from Auth)
  const mockUser = {
    id: "27161a3b-9776-4484-b614-6ca6c18f2403",
    email: "admin@local",
    user_metadata: { display_name: "Admin User" },
    app_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString()
  } as User;

  const mockSession = {
    access_token: "mock-token",
    token_type: "bearer",
    expires_in: 3600,
    refresh_token: "mock-refresh",
    user: mockUser
  } as Session;

  const [session, setSession] = useState<Session | null>(mockSession);
  const [user, setUser] = useState<User | null>(mockUser);
  const [profile, setProfile] = useState<UserRow | null>({
    id: mockUser.id,
    email: mockUser.email,
    display_name: "Admin User",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    created_at: mockUser.created_at,
    updated_at: mockUser.created_at
  } as UserRow);
  const [loading, setLoading] = useState(false);

  // User profile is created via server-side script
  // No client-side upsert needed (would fail due to RLS)

  async function login(email: string, password: string) {
    console.log("Login bypassed (Open Access)");
  }

  async function signup(email: string, password: string, displayName: string) {
    console.log("Signup bypassed (Open Access)");
  }

  async function logout() {
    console.log("Logout disabled (Open Access)");
  }

  return { session, user, profile, loading, login, signup, logout };
}
