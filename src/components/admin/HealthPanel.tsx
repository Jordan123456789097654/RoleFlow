"use client";

import { useEffect, useState } from "react";

const card = "rounded-2xl border border-line bg-surface p-5";

export default function HealthPanel() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/health");
    const json = await res.json();
    if (!res.ok) return setError(json.error);
    setData(json);
  };
  useEffect(() => { load(); }, []);

  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!data) return <p className="text-sm text-faint">Loading health...</p>;

  const sum = (level: string) => data.counts24h.filter((c: any) => c.level === level).reduce((n: number, c: any) => n + c.count, 0);
  const interactionsOk = data.interactions.status === "OK";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className={card}>
          <div className="text-xs text-muted">Discord interactions</div>
          <div className={`mt-1 text-sm font-bold ${interactionsOk ? "text-moss" : "text-gold"}`}>{interactionsOk ? "Receiving" : "No recent heartbeat"}</div>
          <div className="text-[11px] text-faint">{data.interactions.lastSeenAt ? new Date(data.interactions.lastSeenAt).toLocaleString() : "Never"}</div>
        </div>
        <div className={card}><div className="text-xs text-muted">Errors (24h)</div><div className="mt-1 text-2xl font-bold text-danger">{sum("ERROR")}</div></div>
        <div className={card}><div className="text-xs text-muted">Warnings (24h)</div><div className="mt-1 text-2xl font-bold text-gold">{sum("WARN")}</div></div>
        <div className={card}><div className="text-xs text-muted">Info (24h)</div><div className="mt-1 text-2xl font-bold text-ink-2">{sum("INFO")}</div></div>
      </div>

      <section className={card}>
        <h3 className="mb-3 text-sm font-bold text-ink">Last 24 hours by source</h3>
        {data.counts24h.length === 0 ? <p className="text-xs text-faint">No events.</p> : (
          <table className="w-full text-left text-xs">
            <thead className="text-muted"><tr><th className="py-1">Source</th><th>Level</th><th className="text-right">Count</th></tr></thead>
            <tbody>
              {data.counts24h.map((c: any) => (
                <tr key={`${c.source}-${c.level}`} className="border-t border-line">
                  <td className="py-1.5 font-mono text-ink-2">{c.source}</td>
                  <td className={c.level === "ERROR" ? "text-danger" : c.level === "WARN" ? "text-gold" : "text-muted"}>{c.level}</td>
                  <td className="text-right text-ink-2">{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={card}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink">Recent events</h3>
          <button onClick={load} className="text-xs text-accent hover:text-accent">Refresh</button>
        </div>
        <ul className="max-h-96 divide-y divide-line overflow-y-auto">
          {data.recent.map((e: any) => (
            <li key={e.id} className="py-2 text-xs">
              <span className={`mr-2 font-semibold ${e.level === "ERROR" ? "text-danger" : e.level === "WARN" ? "text-gold" : "text-muted"}`}>{e.level}</span>
              <span className="mr-2 font-mono text-accent">{e.source}</span>
              <span className="text-ink-2 break-words">{e.message}</span>
              <div className="text-[10px] text-faint">{new Date(e.createdAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
