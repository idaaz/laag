"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { derivePinHash } from "@/lib/lock/crypto";
import { pinSchema } from "@/lib/validators/schemas";

export function PinSetupDialog({
  open,
  onOpenChange,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: { hash: string; salt: string; iterations: number }) => Promise<void>;
}) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError(null);
    const parsed = pinSchema.safeParse({ pin });
    if (!parsed.success) {
      setError("PIN must be 4-8 digits.");
      return;
    }
    if (pin !== confirmPin) {
      setError("PIN confirmation does not match.");
      return;
    }

    setSaving(true);
    try {
      const payload = await derivePinHash(pin);
      await onSave(payload);
      setPin("");
      setConfirmPin("");
      onOpenChange(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save PIN.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Lock PIN</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            type="password"
            inputMode="numeric"
            placeholder="Enter PIN"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
          />
          <Input
            type="password"
            inputMode="numeric"
            placeholder="Confirm PIN"
            value={confirmPin}
            onChange={(event) => setConfirmPin(event.target.value)}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save PIN"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
