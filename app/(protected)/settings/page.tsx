"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings as SettingsIcon } from "lucide-react";
import { PageFrame } from "@/components/structure/PageFrame";
import { SectionHeader } from "@/components/structure/SectionHeader";
import { PinSetupDialog } from "@/components/lock/PinSetupDialog";
import { LockGate } from "@/components/lock/LockGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { defaultSettings } from "@/lib/config/defaultSettings";
import { estimateExportSizeBytes, exportUserDataAsCsv } from "@/lib/export/csvExport";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SettingsRow } from "@/lib/supabase/types";

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function SettingsPage() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;
  const [pinOpen, setPinOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("dark");
  const [exporting, setExporting] = useState(false);
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [recoveryThresholdInput, setRecoveryThresholdInput] = useState(45);
  const [cachedPinHash, setCachedPinHash] = useState<{
    hash: string;
    salt: string;
    iterations: number;
  } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("laag-theme");
    if (saved === "light") {
      setThemeMode("light");
      document.documentElement.classList.remove("dark");
    } else {
      setThemeMode("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("laag-pin-hash-cache");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { hash: string; salt: string; iterations: number };
      if (parsed.hash && parsed.salt && parsed.iterations) setCachedPinHash(parsed);
    } catch {
      localStorage.removeItem("laag-pin-hash-cache");
    }
  }, []);

  const settings = useQuery<SettingsRow | null>({
    queryKey: ["settings", userId],
    enabled: !!userId,
    staleTime: Infinity,
    queryFn: async () => {
      if (!userId) throw new Error("Missing user");
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as SettingsRow | null;
    }
  });

  const pinHash = useMemo(() => {
    const lock = (settings.data?.lock_mode as Record<string, unknown>) ?? {};
    if (!lock.pinHash || !lock.salt || !lock.iterations) return null;
    return {
      hash: String(lock.pinHash),
      salt: String(lock.salt),
      iterations: Number(lock.iterations)
    };
  }, [settings.data?.lock_mode]);

  const lockMode = useMemo(() => {
    return (settings.data?.lock_mode as { enabled?: boolean } | null) ?? {};
  }, [settings.data?.lock_mode]);

  useEffect(() => {
    if (typeof settings.data?.recovery_threshold === "number") {
      setRecoveryThresholdInput(settings.data.recovery_threshold);
    }
  }, [settings.data?.recovery_threshold]);

  const updateSettings = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      if (!userId) throw new Error("Missing user");
      const base = settings.data ?? {
        ...defaultSettings,
        user_id: userId
      };
      const { error } = await supabase
        .from("settings")
        .upsert(
          {
            ...base,
            ...patch,
            user_id: userId
          } as never,
          { onConflict: "user_id" }
        );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] })
  });

  async function runExport() {
    if (!userId || !user?.email) return;
    setStatusMessage(null);
    setExporting(true);
    try {
      if (!password) throw new Error("Password required.");
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password
      });
      if (authError) throw authError;
      const size = await estimateExportSizeBytes(userId);
      const proceed = window.confirm(
        `Estimated export size: ${(size / 1024).toFixed(1)} KB. Continue?`
      );
      if (!proceed) return;
      const csv = await exportUserDataAsCsv(userId);
      downloadText(`laag-export-${new Date().toISOString().slice(0, 10)}.csv`, csv);
      setStatusMessage("Export complete.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setExporting(false);
      setPassword("");
    }
  }

  return (
    <LockGate enabled={Boolean(lockMode.enabled)} pinHash={pinHash ?? cachedPinHash}>
      <PageFrame
        header={
          <SectionHeader
            title="Settings"
            description="Tune behavior."
            icon={<SettingsIcon className="h-5 w-5" />}
          />
        }
      >
        {userId ? (
          <section className="col-span-full rounded-xl border border-primary/35 bg-primary/10 p-3">
            <p className="text-xs text-muted-foreground mb-1">Extension ID</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 rounded border border-border/70 text-xs font-mono break-all">
                {userId}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(userId);
                  alert("Copied.");
                }}
              >
                Copy
              </Button>
            </div>
          </section>
        ) : null}

        <section className="col-span-full lg:col-span-6 rounded-xl border border-border/80 bg-card/85 p-3 space-y-3">
          <h2 className="text-sm font-semibold">Theme</h2>
          <div className="flex gap-2">
            <Button
              variant={themeMode === "dark" ? "default" : "outline"}
              onClick={() => {
                setThemeMode("dark");
                document.documentElement.classList.add("dark");
                localStorage.setItem("laag-theme", "dark");
              }}
            >
              Dark
            </Button>
            <Button
              variant={themeMode === "light" ? "default" : "outline"}
              onClick={() => {
                setThemeMode("light");
                document.documentElement.classList.remove("dark");
                localStorage.setItem("laag-theme", "light");
              }}
            >
              Light
            </Button>
          </div>
        </section>

        <section className="col-span-full lg:col-span-6 rounded-xl border border-border/80 bg-card/85 p-3 space-y-3">
          <h2 className="text-sm font-semibold">Discipline</h2>
          <Button
            variant={settings.data?.brutal_truth_mode ? "default" : "outline"}
            onClick={() =>
              updateSettings.mutate({
                brutal_truth_mode: !settings.data?.brutal_truth_mode
              })
            }
          >
            Truth: {settings.data?.brutal_truth_mode ? "On" : "Off"}
          </Button>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={100}
              value={recoveryThresholdInput}
              onChange={(event) => setRecoveryThresholdInput(Number(event.target.value))}
              aria-label="Recovery threshold"
            />
            <Button
              variant="outline"
              onClick={() =>
                updateSettings.mutate({
                  recovery_threshold: Math.max(0, Math.min(100, recoveryThresholdInput))
                })
              }
            >
              Save
            </Button>
          </div>
        </section>

        <section className="col-span-full lg:col-span-6 rounded-xl border border-border/80 bg-card/85 p-3 space-y-3">
          <h2 className="text-sm font-semibold">Lock</h2>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setPinOpen(true)}>PIN</Button>
            <Button
              variant="outline"
              onClick={() =>
                updateSettings.mutate({
                  lock_mode: {
                    ...((settings.data?.lock_mode as Record<string, unknown>) ?? {}),
                    enabled: !Boolean(lockMode.enabled)
                  }
                })
              }
            >
              Toggle
            </Button>
          </div>
          <PinSetupDialog
            open={pinOpen}
            onOpenChange={setPinOpen}
            onSave={async (payload) => {
              localStorage.setItem("laag-pin-hash-cache", JSON.stringify(payload));
              setCachedPinHash(payload);
              await updateSettings.mutateAsync({
                lock_mode: {
                  enabled: true,
                  pinHash: payload.hash,
                  salt: payload.salt,
                  iterations: payload.iterations,
                  timeoutMinutes: 15
                }
              });
            }}
          />
        </section>

        <section className="col-span-full lg:col-span-6 rounded-xl border border-border/80 bg-card/85 p-3 space-y-3">
          <h2 className="text-sm font-semibold">Export</h2>
          <Input
            type="password"
            placeholder="Confirm password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button onClick={runExport} disabled={exporting}>
            {exporting ? "Exporting..." : "Export"}
          </Button>
          {statusMessage ? <p className="text-sm text-muted-foreground">{statusMessage}</p> : null}
        </section>
      </PageFrame>
    </LockGate>
  );
}
