"use client";

import React, { useState } from "react";
import { Bookmark } from "lucide-react";

export function SaveOpeningButton({
  positionId,
  initialSaved,
  signedIn,
}: {
  positionId: string;
  initialSaved: boolean;
  signedIn: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!signedIn) {
      window.location.href = "/login";
      return;
    }
    setBusy(true);
    const previous = saved;
    setSaved(!previous);
    try {
      const res = await fetch("/api/saved-positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionId }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setSaved(Boolean(data.saved));
    } catch {
      setSaved(previous);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved openings" : "Save opening for later"}
      title={saved ? "Saved" : "Save for later"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
        saved ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-muted hover:text-ink hover:border-line-strong"
      }`}
    >
      <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
    </button>
  );
}
