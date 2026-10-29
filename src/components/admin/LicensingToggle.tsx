"use client";

import { useEffect, useState } from "react";

export default function LicensingToggle() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/licensing").then((r) => r.json()).then((d) => setEnabled(!!d.enabled));
  }, []);

  const toggle = async () => {
    const next = !enabled;
    const warning = next
      ? "Turn licensing ON? Free limits apply to everyone again and paid features need a license key."
      : "Turn licensing OFF (beta)? Every community and account gets paid features for free until you turn it back on.";
    if (!confirm(warning)) return;
    const res = await fetch("/api/admin/licensing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });
    if (res.ok) {
      setEnabled(next);
      setMessage(next ? "Licensing is on. Free limits are enforced." : "Licensing is off. Everything is free during beta.");
    } else {
      setMessage("Only the Founder can change this.");
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-surface/[0.02] p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-ink">Licensing system</h3>
          <p className="mt-1 text-xs text-muted">
            {enabled === null ? "Loading..." : enabled
              ? "ON: free limits apply (1 community per account, 3 open positions per community, no custom bot or webhook logs). License keys unlock paid tiers."
              : "OFF (beta): every community and account has paid features for free."}
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={enabled === null}
          className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold text-white disabled:opacity-40 ${enabled ? "bg-rose-600 hover:bg-rose-500" : "bg-emerald-600 hover:bg-emerald-500"}`}
        >
          {enabled ? "Turn licensing off (beta)" : "Turn licensing on"}
        </button>
      </div>
      {message && <p className="text-xs text-moss">{message}</p>}
    </div>
  );
}
