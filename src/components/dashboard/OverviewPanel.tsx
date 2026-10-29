"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type App = { id: string; status: string; createdAt: string; user: { username: string }; position: { title: string } };
type Position = { id: string; title: string; isOpen: boolean; _count?: { applications: number } };

const WAITING = ["PENDING", "UNDER_REVIEW", "INTERVIEW"];

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

/** Staff home view: what needs attention first, what's new since the last visit, and open positions. */
export default function OverviewPanel({ guildId, onOpenApplications }: { guildId: string; onOpenApplications: () => void }) {
  const [apps, setApps] = useState<App[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [newSince, setNewSince] = useState<number | null>(null);
  const [lastVisit, setLastVisit] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = `rf:lastVisit:${guildId}`;
    const previous = window.localStorage.getItem(key);
    setLastVisit(previous);

    (async () => {
      try {
        const res = await fetch(`/api/guilds/${guildId}/dashboard`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load overview");
        const src = data.guild ?? data;
        const allApps: App[] = src.applications ?? [];
        setApps(allApps);
        setPositions(src.positions ?? []);
        if (previous) {
          const since = new Date(previous).getTime();
          setNewSince(allApps.filter((a) => new Date(a.createdAt).getTime() > since).length);
        } else {
          setNewSince(allApps.length);
        }
        window.localStorage.setItem(key, new Date().toISOString());
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  if (loading) return <p className="text-sm text-faint">Loading overview...</p>;
  if (error) return <p className="text-sm text-danger">{error}</p>;

  const waiting = apps
    .filter((a) => WAITING.includes(a.status))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(0, 8);
  const openPositions = positions.filter((p) => p.isOpen);
  const card = "rounded-2xl border border-line bg-surface p-5";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 divide-y divide-white/10 rounded-2xl border border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-5">
          <div className="text-xs text-muted">Waiting for review</div>
          <div className="mt-1 text-2xl font-bold text-ink">{waiting.length}</div>
        </div>
        <div className="p-5">
          <div className="text-xs text-muted">New since your last visit</div>
          <div className="mt-1 text-2xl font-bold text-ink">{newSince ?? 0}</div>
          <div className="text-[11px] text-faint">{lastVisit ? `Last visit ${new Date(lastVisit).toLocaleString()}` : "First visit"}</div>
        </div>
        <div className="p-5">
          <div className="text-xs text-muted">Open positions</div>
          <div className="mt-1 text-2xl font-bold text-ink">{openPositions.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className={card}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">Waiting longest</h3>
            <button onClick={onOpenApplications} className="text-xs text-accent hover:text-accent">View all</button>
          </div>
          {waiting.length === 0 ? (
            <p className="text-xs text-faint">No applications are waiting for review.</p>
          ) : (
            <ul className="divide-y divide-line">
              {waiting.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-ink">{a.user.username}</div>
                    <div className="truncate text-[11px] text-faint">{a.position.title}</div>
                  </div>
                  <span className={`shrink-0 text-[11px] font-semibold ${daysSince(a.createdAt) >= 7 ? "text-danger" : "text-muted"}`}>
                    {daysSince(a.createdAt)}d
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={card}>
          <h3 className="mb-3 text-sm font-bold text-ink">Open positions</h3>
          {openPositions.length === 0 ? (
            <p className="text-xs text-faint">No open positions. Create one in the Form Builder.</p>
          ) : (
            <ul className="divide-y divide-line">
              {openPositions.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="truncate text-xs font-semibold text-ink">{p.title}</span>
                  <span className="shrink-0 rounded-md bg-sunk px-2 py-0.5 text-[11px] text-ink-2">
                    {p._count?.applications ?? 0} applications
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
