"use client";

import React, { useEffect, useState } from "react";

type Pending = { id: string; title: string; body: string; readSeconds: number };

/**
 * Blocks the page with any unacknowledged hard-gate announcement.
 * The acknowledge button stays disabled until the minimum read time has passed.
 */
export function AnnouncementGate({ guildId }: { guildId: string }) {
  const [queue, setQueue] = useState<Pending[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/guilds/${guildId}/announcements/pending`)
      .then((r) => (r.ok ? r.json() : { pending: [] }))
      .then((d) => {
        setQueue(d.pending ?? []);
        setSecondsLeft(d.pending?.[0]?.readSeconds ?? 0);
      })
      .catch(() => setQueue([]));
  }, [guildId]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const current = queue[0];
  if (!current) return null;

  async function acknowledge() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/guilds/${guildId}/announcements/${current.id}/ack`, { method: "POST" });
    setBusy(false);
    if (!res.ok) return setError("Could not record your acknowledgment. Try again.");
    const next = queue.slice(1);
    setQueue(next);
    setSecondsLeft(next[0]?.readSeconds ?? 0);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6">
        <p className="eyebrow mb-2">Required reading</p>
        <h2 className="text-[20px] font-semibold text-ink">{current.title}</h2>
        <div className="mt-4 max-h-[50vh] overflow-y-auto whitespace-pre-wrap text-[14px] leading-relaxed text-muted">{current.body}</div>
        <button
          onClick={acknowledge}
          disabled={busy || secondsLeft > 0}
          className="mt-6 w-full rounded-lg bg-accent px-4 py-2.5 text-[14px] font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {secondsLeft > 0 ? `Available in ${secondsLeft}s` : "I acknowledge and understand these guidelines"}
        </button>
        {error && <p className="mt-3 text-[13px] text-red-700">{error}</p>}
        {queue.length > 1 && <p className="mt-3 text-[12px] text-muted">{queue.length - 1} more after this one</p>}
      </div>
    </div>
  );
}
