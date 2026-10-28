"use client";

import { useEffect, useState } from "react";

const card = "rounded-2xl border border-white/10 bg-white/[0.02] p-5";

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

  if (error) return <p className="text-sm text-rose-400">{error}</p>;
  if (!data) return <p className="text-sm text-slate-500">Loading health...</p>;

  const sum = (level: string) => data.counts24h.filter((c: any) => c.level === level).reduce((n: number, c: any) => n + c.count, 0);
  const interactionsOk = data.interactions.status === "OK";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className={card}>
          <div className="text-xs text-slate-400">Discord interactions</div>
          <div className={`mt-1 text-sm font-bold ${interactionsOk ? "text-emerald-300" : "text-amber-300"}`}>{interactionsOk ? "Receiving" : "No recent heartbeat"}</div>
          <div className="text-[11px] text-slate-500">{data.interactions.lastSeenAt ? new Date(data.interactions.lastSeenAt).toLocaleString() : "Never"}</div>
        </div>
        <div className={card}><div className="text-xs text-slate-400">Errors (24h)</div><div className="mt-1 text-2xl font-bold text-rose-300">{sum("ERROR")}</div></div>
        <div className={card}><div className="text-xs text-slate-400">Warnings (24h)</div><div className="mt-1 text-2xl font-bold text-amber-300">{sum("WARN")}</div></div>
        <div className={card}><div className="text-xs text-slate-400">Info (24h)</div><div className="mt-1 text-2xl font-bold text-slate-200">{sum("INFO")}</div></div>
      </div>

      <section className={card}>
        <h3 className="mb-3 text-sm font-bold text-white">Last 24 hours by source</h3>
        {data.counts24h.length === 0 ? <p className="text-xs text-slate-500">No events.</p> : (
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400"><tr><th className="py-1">Source</th><th>Level</th><th className="text-right">Count</th></tr></thead>
            <tbody>
              {data.counts24h.map((c: any) => (
                <tr key={`${c.source}-${c.level}`} className="border-t border-white/5">
                  <td className="py-1.5 font-mono text-slate-200">{c.source}</td>
                  <td className={c.level === "ERROR" ? "text-rose-300" : c.level === "WARN" ? "text-amber-300" : "text-slate-400"}>{c.level}</td>
                  <td className="text-right text-slate-200">{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className={card}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Recent events</h3>
          <button onClick={load} className="text-xs text-purple-400 hover:text-purple-300">Refresh</button>
        </div>
        <ul className="max-h-96 divide-y divide-white/5 overflow-y-auto">
          {data.recent.map((e: any) => (
            <li key={e.id} className="py-2 text-xs">
              <span className={`mr-2 font-semibold ${e.level === "ERROR" ? "text-rose-300" : e.level === "WARN" ? "text-amber-300" : "text-slate-400"}`}>{e.level}</span>
              <span className="mr-2 font-mono text-purple-300">{e.source}</span>
              <span className="text-slate-300 break-words">{e.message}</span>
              <div className="text-[10px] text-slate-600">{new Date(e.createdAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
