"use client";

import { useEffect, useState } from "react";

type AuditRow = {
  id: string;
  createdAt: string;
  actorId: string;
  actorName: string | null;
  action: string;
  targetId: string | null;
  details: string | null;
};

export default function AuditLogPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const load = async (action: string) => {
    const res = await fetch(`/api/admin/audit${action ? `?action=${encodeURIComponent(action)}` : ""}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load audit log");
      setRows([]);
      return;
    }
    setError(null);
    setRows(data);
  };

  useEffect(() => {
    load("");
  }, []);

  return (
    <main className="min-h-screen bg-paper p-8 text-ink-2">
      <h1 className="mb-4 text-2xl font-bold text-ink">Audit log</h1>
      <div className="mb-4 flex gap-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by action, e.g. USER_DELETE"
          className="w-80 rounded-lg border border-line bg-sunk px-3 py-2 text-sm text-ink outline-none"
        />
        <button onClick={() => load(filter.trim())} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white">
          Apply
        </button>
      </div>
      {error && <p className="text-danger">{error}</p>}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface/[0.03] text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">Actor</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Target</th>
              <th className="px-4 py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="px-4 py-2 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2">{r.actorName || r.actorId}</td>
                <td className="px-4 py-2 font-mono text-accent">{r.action}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.targetId || "-"}</td>
                <td className="px-4 py-2 font-mono text-xs text-muted">{r.details || ""}</td>
              </tr>
            ))}
            {!error && rows.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-faint" colSpan={5}>No entries.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
