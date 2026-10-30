"use client";

import React, { useEffect, useState } from "react";

const input = "w-full px-3 py-2 rounded-xl bg-surface border border-line text-xs text-ink focus:outline-none focus:border-accent";
const btn = "px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold disabled:opacity-40";

function defaultNoticeId() {
  const d = new Date();
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `${ymd}-policies`;
}

/** Sends the policy update email from the website. Each address is emailed once per notice ID. */
export default function PolicyNoticePanel() {
  const [noticeId, setNoticeId] = useState(defaultNoticeId());
  const [summary, setSummary] = useState("");
  const [progress, setProgress] = useState<{ sent: number; remaining: number } | null>(null);
  const [dry, setDry] = useState<{ wouldSend: number; alreadySent: number; samples: { name: string; email: string }[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function refresh() {
    if (!noticeId.trim()) return;
    const res = await fetch(`/api/founder/policy-notice?noticeId=${encodeURIComponent(noticeId.trim())}`);
    if (res.ok) setProgress(await res.json());
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [noticeId]);

  async function countRecipients() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/founder/policy-notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noticeId, dryRun: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not count recipients.");
      setDry(data);
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  }

  async function sendBatch() {
    if (!window.confirm(`Send the policy update email now for "${noticeId}"?\n\nIt sends in batches of up to 500. Each address is emailed once for this notice ID.`)) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/founder/policy-notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noticeId, dryRun: false, summary }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sending failed.");
      await refresh();
      setMsg({
        ok: data.failed === 0,
        text: data.remaining > 0
          ? `Sent ${data.sent} this batch${data.failed ? `, ${data.failed} failed` : ""}. ${data.remaining} left. Click again to continue.`
          : `Done. ${data.sent} sent this batch${data.failed ? `, ${data.failed} failed (click again to retry them)` : ""}. Nothing left to send.`,
      });
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass-panel p-5 rounded-2xl space-y-4">
      <div>
        <h2 className="text-sm font-bold text-ink">Policy update email</h2>
        <p className="text-[12px] text-muted mt-1">
          Sends from this website to every eligible account email and every verified company address. Each address is emailed once per notice ID.
          Use a new notice ID for each notice.
        </p>
      </div>

      <div>
        <label className="text-[11px] font-semibold text-muted">Notice ID</label>
        <input className={input} value={noticeId} onChange={(e) => { setNoticeId(e.target.value); setDry(null); }} />
      </div>

      <div>
        <label className="text-[11px] font-semibold text-muted">What changed (shown in the email, 20 to 2000 characters)</label>
        <textarea rows={4} className={input} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Explain the changes in plain language. Separate paragraphs with a blank line." />
      </div>

      {progress && (
        <p className="text-[12px] text-ink-2">Already sent for this notice ID: <span className="font-semibold">{progress.sent}</span> · still to send: <span className="font-semibold">{progress.remaining}</span></p>
      )}

      {dry && (
        <div className="p-3 rounded-xl bg-sunk text-[12px] space-y-1">
          <p className="text-ink-2">Would send to <span className="font-semibold">{dry.wouldSend}</span> address(es). Already sent: {dry.alreadySent}.</p>
          {dry.samples.map((s, i) => <p key={i} className="text-muted font-mono text-[11px]">{s.name || "(no name)"} · {s.email}</p>)}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button className={`${btn} bg-surface text-ink-2 border border-line`} disabled={busy || !noticeId.trim()} onClick={countRecipients}>Count recipients</button>
        <button className={btn} disabled={busy || summary.trim().length < 20 || !noticeId.trim()} onClick={sendBatch}>
          {busy ? "Sending..." : "Send batch of up to 500"}
        </button>
      </div>

      {msg && <p className={`text-xs ${msg.ok ? "text-emerald-500" : "text-danger"}`}>{msg.text}</p>}
    </section>
  );
}
