"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Undo2 } from "lucide-react";

export function WithdrawButton({ applicationId, label }: { applicationId: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function withdraw() {
    if (!window.confirm(`Withdraw your application for ${label}?\n\nYour answers will be deleted, and staff will no longer see this application.\n\nThis cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not withdraw application.");
      }
      router.refresh();
    } catch (e: any) {
      setError(e.message || "Could not withdraw application.");
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={withdraw} disabled={busy} className="btn-ghost btn-sm">
        <Undo2 className="h-3.5 w-3.5" />
        {busy ? "Withdrawing..." : "Withdraw"}
      </button>
      {error && <span className="error-text">{error}</span>}
    </span>
  );
}
