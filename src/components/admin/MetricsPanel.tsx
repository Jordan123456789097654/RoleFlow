"use client";

import { useEffect, useState } from "react";

const card = "rounded-2xl border border-white/10 bg-white/[0.02] p-5";

function Bars({ title, rows }: { title: string; rows: { weekStart: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <section className={card}>
      <h3 className="mb-4 text-sm font-bold text-white">{title}</h3>
      <div className="flex h-36 items-end gap-1.5">
        {rows.map((r) => (
          <div key={r.weekStart} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${r.weekStart}: ${r.count}`}>
            <span className="text-[10px] text-slate-400">{r.count}</span>
            <div className="w-full rounded-t bg-purple-500/70" style={{ height: `${(r.count / max) * 100}%`, minHeight: r.count ? 4 : 0 }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-slate-600">
        <span>{rows[0]?.weekStart}</span>
        <span>{rows[rows.length - 1]?.weekStart}</span>
      </div>
    </section>
  );
}

export default function MetricsPanel() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/admin/metrics").then((r) => r.json()).then(setData);
  }, []);
  if (!data || data.error) return <p className="text-sm text-slate-500">{data?.error || "Loading metrics..."}</p>;

  const pct = (v: number | null) => (v === null ? "No data" : `${v}%`);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className={card}><div className="text-xs text-slate-400">Acceptance rate, last 30 days</div><div className="mt-1 text-2xl font-bold text-white">{pct(data.acceptanceRate30d)}</div></div>
        <div className={card}><div className="text-xs text-slate-400">Acceptance rate, all time</div><div className="mt-1 text-2xl font-bold text-white">{pct(data.acceptanceRateAllTime)}</div></div>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Bars title="Communities created per week (12 weeks)" rows={data.communitiesPerWeek} />
        <Bars title="Applications per week (12 weeks)" rows={data.applicationsPerWeek} />
      </div>
    </div>
  );
}
