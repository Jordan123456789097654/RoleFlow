"use client";

import React, { useState } from "react";

const input = "w-full px-3 py-2 rounded-xl bg-surface border border-line text-xs text-ink focus:outline-none focus:border-accent";
const btn = "px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold disabled:opacity-40";

/** Use during a breach or a compromised account. Every change here is audit-logged. */
export default function EmergencyPanel() {
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function signOutEveryone() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/founder/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signOutEveryone", reason, confirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not sign everyone out.");
      setConfirm("");
      setMsg({ ok: true, text: `Signed out ${data.signedOut} accounts. You stay signed in on this browser.` });
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass-panel p-5 rounded-2xl space-y-4 border border-rose-500/30">
      <div>
        <h2 className="text-sm font-bold text-danger">Emergency response</h2>
        <p className="text-[12px] text-muted mt-1 max-w-3xl">
          Use these if credentials may be exposed. Signing everyone out ends every session, including admins and support staff, who must sign in again.
          To notify people, use the Security templates in Bulk email (data breach notice, password reset required, incident update).
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-[11px] font-semibold text-muted">Reason (required, kept in the audit log)</label>
          <input className={input} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Suspected token leak from the old bot host" />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted">Type SIGN OUT EVERYONE to confirm</label>
          <input className={input} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="SIGN OUT EVERYONE" />
        </div>
      </div>
      <button className={btn} disabled={busy || reason.trim().length < 10 || confirm !== "SIGN OUT EVERYONE"} onClick={signOutEveryone}>
        {busy ? "Working..." : "Sign out every account"}
      </button>
      {msg && <p className={`text-xs ${msg.ok ? "text-emerald-500" : "text-danger"}`}>{msg.text}</p>}
    </section>
  );
}
