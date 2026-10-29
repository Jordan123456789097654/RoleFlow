"use client";

import React, { useState } from "react";

export function LiveOpsForm({ guildId, liveCount }: { guildId: string; liveCount: number }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  async function send() {
    if (!window.confirm(`Send this notice to ${liveCount} live server(s)? Every player in those servers will see it.`)) return;
    setBusy(true);
    setStatus(null);
    const res = await fetch(`/api/guilds/${guildId}/broadcasts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, confirm: true }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setMessage("");
      setStatus({ ok: true, text: `Sent to ${data.liveServers} server(s).` });
      window.location.reload();
    } else {
      setStatus({ ok: false, text: data.error || "Could not send." });
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-[14px] text-ink"
        rows={2}
        maxLength={200}
        placeholder="Notice for every player on every live server (plain text, 200 characters max)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={send}
          disabled={busy || !message.trim() || liveCount === 0}
          className="rounded-lg bg-accent px-4 py-2 text-[14px] font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {busy ? "Sending…" : `Send to ${liveCount} live server${liveCount === 1 ? "" : "s"}`}
        </button>
        {status && <span className={`text-[13px] ${status.ok ? "text-green-700" : "text-red-700"}`}>{status.text}</span>}
      </div>
    </div>
  );
}
