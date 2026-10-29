"use client";

import { useEffect, useState } from "react";

type Row = {
  positionId: string;
  title: string;
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  acceptanceRate: number | null;
  medianHoursToDecision: number | null;
};

function formatHours(h: number | null) {
  if (h === null) return "No decisions yet";
  if (h < 24) return `${h} h`;
  return `${Math.round((h / 24) * 10) / 10} days`;
}

/** Time-to-decision and acceptance rate for each position in this community. */
export default function PositionAnalytics({ guildId }: { guildId: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/guilds/${guildId}/analytics`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load analytics.");
        setRows(data.positions);
      })
      .catch((e) => setError(e.message));
  }, [guildId]);

  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <h3 className="mb-1 text-sm font-bold text-ink">Position performance</h3>
      <p className="mb-4 text-xs text-faint">Decision times are estimates based on when each application was last updated.</p>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {!error && !rows && <p className="text-xs text-faint">Loading…</p>}
      {rows && rows.length === 0 && <p className="text-xs text-faint">No positions yet.</p>}

      {rows && rows.length > 0 && (
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li key={r.positionId} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-xs font-semibold text-ink">{r.title}</span>
                <span className="shrink-0 text-[11px] text-ink-2">{r.total} total · {r.pending} pending</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sunk">
                <div
                  className="h-full bg-accent"
                  style={{ width: `${r.acceptanceRate ?? 0}%` }}
                />
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-4 text-[11px] text-muted">
                <span>Acceptance: {r.acceptanceRate === null ? "n/a" : `${r.acceptanceRate}%`}</span>
                <span>Median decision: {formatHours(r.medianHoursToDecision)}</span>
                <span>{r.accepted} accepted · {r.rejected} rejected</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
