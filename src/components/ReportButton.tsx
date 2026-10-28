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
      <button onClick={() => setOpen(true)} className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-colors">
        Report
      </button>
    );
  }
  return (
    <div className="w-full max-w-sm space-y-2">
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={500} placeholder="What is wrong with this?" className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-purple-500" />
      <div className="flex items-center gap-2">
        <button disabled={!reason.trim()} onClick={submit} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">Send report</button>
        <button onClick={() => setOpen(false)} className="text-xs text-slate-400 hover:text-white">Cancel</button>
        {status && <span className="text-xs text-slate-300">{status}</span>}
      </div>
    </div>
  );
}
