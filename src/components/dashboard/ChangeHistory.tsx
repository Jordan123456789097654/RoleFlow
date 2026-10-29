"use client";

import { useEffect, useState } from "react";

type Entry = { id: string; action: string; createdAt: string; actor: string; position: string };

const LABELS: Record<string, string> = {
  POSITION_CREATE: "created",
  POSITION_DUPLICATE: "duplicated",
  POSITION_UPDATE: "edited",
};

/** Recent opening changes, so owners can see who changed what. */
export default function ChangeHistory({ guildId }: { guildId: string }) {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/guilds/${guildId}/history`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Could not load history.");
        setEntries(body.entries);
      })
      .catch((e) => setError(e.message));
  }, [guildId]);

  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <h3 className="mb-3 text-sm font-bold text-ink">Recent changes</h3>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!error && !entries && <p className="text-xs text-faint">Loading…</p>}
      {entries && entries.length === 0 && <p className="text-xs text-faint">No changes recorded yet.</p>}
      {entries && entries.length > 0 && (
        <ul className="divide-y divide-line">
          {entries.map((e) => (
            <li key={e.id} className="py-2 text-xs text-ink-2">
              <span className="font-semibold text-ink">{e.actor}</span> {LABELS[e.action] ?? "changed"}{" "}
              <span className="font-semibold text-ink">{e.position}</span>
              <span className="ml-2 text-faint">{new Date(e.createdAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
