"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  message: string;
  website: string | null;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  guild: { id: string; name: string; vanitySlug: string | null; verifiedBadges: string | null; memberCount: number };
};

export function PartnershipReview({ isFounder }: { isFounder: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/partnerships", { cache: "no-store" });
    if (res.ok) setRows(await res.json());
    else setError("You need founder access to review partnerships.");
    setLoading(false);
  }

  useEffect(() => {
    if (isFounder) load();
    else setLoading(false);
  }, [isFounder]);

  async function decide(id: string, decision: "APPROVED" | "REJECTED") {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/partnerships/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note: notes[id] || "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || "Could not save the decision.");
      else await load();
    } finally {
      setBusyId(null);
    }
  }

  if (!isFounder) {
    return <p className="text-sm text-muted">Partnership decisions are made by the founder.</p>;
  }

  const pending = rows.filter((r) => r.status === "PENDING");
  const decided = rows.filter((r) => r.status !== "PENDING");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="display-md">Partnership applications</h2>
        <p className="mt-1 text-sm text-muted">Approve to add the Partner badge to a community. Add a note for the owner if you want.</p>
      </div>

      {error && <div className="rounded-xl border border-red-500/40 px-4 py-3 text-sm text-red-300">{error}</div>}
      {loading && <p className="text-sm text-muted">Loading…</p>}

      <section className="space-y-4">
        <p className="eyebrow">Waiting for review ({pending.length})</p>
        {pending.length === 0 && !loading && <p className="text-sm text-muted">No applications are waiting.</p>}
        {pending.map((r) => (
          <article key={r.id} className="card space-y-3 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-base font-bold text-ink">{r.guild.name}</h3>
              <p className="font-mono text-[12px] text-faint">
                {r.guild.memberCount} members · sent {new Date(r.createdAt).toLocaleDateString()}
              </p>
            </div>
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink-2">{r.message}</p>
            {r.website && (
              <a href={r.website} target="_blank" rel="noreferrer" className="text-[13px] text-accent hover:underline">
                {r.website}
              </a>
            )}
            <textarea
              value={notes[r.id] || ""}
              onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
              rows={2}
              maxLength={1000}
              placeholder="Note to the owner (optional)"
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13px] text-ink focus:border-accent focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => decide(r.id, "APPROVED")}
                className="btn-primary btn-sm disabled:opacity-50"
              >
                Approve and add Partner badge
              </button>
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => decide(r.id, "REJECTED")}
                className="btn-ghost btn-sm disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <p className="eyebrow">Decided ({decided.length})</p>
        {decided.map((r) => (
          <div key={r.id} className="card flex flex-wrap items-center justify-between gap-2 p-4">
            <div>
              <p className="text-[14px] font-semibold text-ink">{r.guild.name}</p>
              {r.reviewNote && <p className="text-[12px] text-muted">Note: {r.reviewNote}</p>}
            </div>
            <span className={`text-[12px] font-bold ${r.status === "APPROVED" ? "text-emerald-300" : "text-red-300"}`}>
              {r.status === "APPROVED" ? "Approved" : "Rejected"}
              {r.reviewedAt ? ` · ${new Date(r.reviewedAt).toLocaleDateString()}` : ""}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
