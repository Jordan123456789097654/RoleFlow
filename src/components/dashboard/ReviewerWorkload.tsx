"use client";

import { useEffect, useState } from "react";

type Data = {
  reviewers: { userId: string; username: string; pending: number }[];
  unassigned: number;
};

/** Open applications per staff member, so the owner can balance review work. */
export default function ReviewerWorkload({ guildId }: { guildId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/guilds/${guildId}/workload`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Could not load workload.");
        setData(body);
      })
      .catch((e) => setError(e.message));
  }, [guildId]);

  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <h3 className="mb-1 text-sm font-bold text-ink">Reviewer workload</h3>
      <p className="mb-4 text-xs text-faint">Open applications (pending, in review, or interviewing) per staff member.</p>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {!error && !data && <p className="text-xs text-faint">Loading…</p>}

      {data && (
        <ul className="divide-y divide-line">
          {data.reviewers.length === 0 && <li className="py-2 text-xs text-faint">No staff added yet.</li>}
          {data.reviewers.map((r) => (
            <li key={r.userId} className="flex items-center justify-between py-2 text-xs">
              <span className="font-semibold text-ink">{r.username}</span>
              <span className="text-ink-2">{r.pending} open</span>
            </li>
          ))}
          <li className="flex items-center justify-between py-2 text-xs">
            <span className="text-muted">Unassigned</span>
            <span className="text-ink-2">{data.unassigned}</span>
          </li>
        </ul>
      )}
    </section>
  );
}
