"use client";

import { useState } from "react";

export default function ReportButton({ targetType, targetId }: { targetType: "GUILD" | "POSITION"; targetId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const submit = async () => {
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, reason }),
    });
    const data = await res.json();
    setStatus(res.ok ? "Thanks. Our team will review this." : data.error);
    if (res.ok) setReason("");
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-ghost btn-sm text-muted">
        Report
      </button>
    );
  }
  return (
    <div className="w-full max-w-sm space-y-2">
      <label className="sr-only" htmlFor={`report-${targetType}-${targetId}`}>Report reason</label>
      <textarea
        id={`report-${targetType}-${targetId}`}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder="What is wrong with this?"
        className="field field-sm"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={!reason.trim()} onClick={submit} className="btn-danger btn-sm">Send report</button>
        <button type="button" onClick={() => setOpen(false)} className="text-[13px] text-muted hover:text-ink">Cancel</button>
        {status && <span role="status" className="text-[13px] text-ink-2">{status}</span>}
      </div>
    </div>
  );
}
