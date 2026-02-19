"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { verifyPin } from "@/lib/lock/crypto";
import { clearLockSession, setLockSession } from "@/lib/lock/session";

export function LockGate({
  enabled,
  pinHash,
  children
}: {
  enabled: boolean;
  pinHash: { hash: string; salt: string; iterations: number } | null;
  children: React.ReactNode;
}) {
  const [locked, setLocked] = useState(enabled);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (enabled && !pinHash) setLocked(false);
  }, [enabled, pinHash]);

  useEffect(() => {
    setLocked(enabled);
  }, [enabled]);

  async function handleUnlock(event: FormEvent) {
    event.preventDefault();
    if (!pinHash) {
      setLocked(false);
      return;
    }
    const ok = await verifyPin(pin, pinHash);
    if (!ok) {
      setError("Incorrect PIN.");
      return;
    }
    setLockSession({
      encryptedToken: btoa(`laag-lock-${Date.now()}`),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });
    setLocked(false);
    setPin("");
  }

  if (!locked) return <>{children}</>;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Lock Mode Active</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleUnlock}>
            <Input
              type="password"
              placeholder="Enter PIN"
              inputMode="numeric"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="submit">Unlock</Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  clearLockSession();
                  setPin("");
                }}
              >
                Reset local session
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
