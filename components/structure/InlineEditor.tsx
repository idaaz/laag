"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type InlineEditorProps = {
  value: string;
  label: string;
  onSave: (nextValue: string) => Promise<void> | void;
  onCancel?: () => void;
  placeholder?: string;
  disabled?: boolean;
};

export function InlineEditor({
  value,
  label,
  onSave,
  onCancel,
  placeholder,
  disabled
}: InlineEditorProps) {
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (disabled || saving) return;
    setSaving(true);
    try {
      await onSave(draft.trim());
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="flex items-center gap-2" onSubmit={handleSubmit}>
      <Input
        aria-label={label}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        disabled={disabled || saving}
        className="h-9 text-sm"
      />
      <Button
        type="submit"
        size="icon"
        aria-label="Save"
        title="Save"
        disabled={disabled || saving || !draft.trim()}
        className="h-9 w-9"
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="icon"
        aria-label="Cancel"
        title="Cancel"
        variant="outline"
        disabled={disabled || saving}
        className="h-9 w-9"
        onClick={() => {
          setDraft(value);
          onCancel?.();
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </form>
  );
}
