"use client";

import React, { useState } from "react";

type Role = { rank: number; name: string };
type Rule = { robloxRankId: number; rankName: string; weeklyMinutes: number };
type Row = { rank: string; name: string; hours: string };

export function QuotaEditor({ guildId, initialRules, roles }: { guildId: string; initialRules: Rule[]; roles: Role[] }) {
  const [rows, setRows] = useState<Row[]>(
    initialRules.map((r) => ({ rank: String(r.robloxRankId), name: r.rankName, hours: String(r.weeklyMinutes / 60) }))
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const roleName = (rank: number) => roles.find((r) => r.rank === rank)?.name ?? `Rank ${rank}`;

  function update(i: number, patch: Partial<Row>) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function save() {
    setMessage(null);
    const payload: { robloxRankId: number; rankName: string; weeklyMinutes: number }[] = [];
    for (const r of rows) {
      if (r.rank === "") continue;
      const hours = Number(r.hours);
      if (!Number.isFinite(hours) || hours < 0 || hours > 168) {
        setMessage({ ok: false, text: "Hours per week must be between 0 and 168." });
        return;
      }
      const rankId = Number(r.rank);
      payload.push({
        robloxRankId: rankId,
        rankName: r.name.trim() || roleName(rankId),
        weeklyMinutes: Math.round(hours * 60),
      });
    }
    setBusy(true);
    const res = await fetch(`/api/guilds/${guildId}/quotas`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rules: payload }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setMessage(res.ok ? { ok: true, text: "Quotas saved." } : { ok: false, text: data.error || "Could not save." });
  }

  const selectable = roles.filter((r) => r.rank > 0);

  return (
    <div className="mt-10">
      <p className="text-[14px] font-medium text-ink">Weekly quotas by rank</p>
      <p className="mt-1 text-[13px] text-muted">Hours each staff member needs per week for their Roblox rank.</p>

      <div className="mt-4 space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <select
              value={r.rank}
              onChange={(e) => update(i, { rank: e.target.value, name: roleName(Number(e.target.value)) })}
              className="rounded-lg border border-line bg-transparent px-3 py-2 text-[14px] text-ink"
            >
              <option value="">Choose rank</option>
              {selectable.map((role) => (
                <option key={role.rank} value={role.rank}>
                  {role.name} (rank {role.rank})
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              max={168}
              step={0.5}
              value={r.hours}
              onChange={(e) => update(i, { hours: e.target.value })}
              className="w-24 rounded-lg border border-line bg-transparent px-3 py-2 text-[14px] text-ink"
              aria-label="Hours per week"
            />
            <span className="text-[13px] text-muted">hours / week</span>
            <button
              onClick={() => setRows(rows.filter((_, idx) => idx !== i))}
              className="text-[13px] text-muted hover:text-ink"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => setRows([...rows, { rank: "", name: "", hours: "2" }])}
          className="rounded-lg border border-line px-4 py-2 text-[14px] text-ink hover:bg-sunk"
        >
          Add rank
        </button>
        <button
          onClick={save}
          disabled={busy}
          className="rounded-lg bg-accent px-4 py-2 text-[14px] font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save quotas"}
        </button>
        {message && (
          <span className={`text-[13px] ${message.ok ? "text-green-700" : "text-red-700"}`}>{message.text}</span>
        )}
      </div>
    </div>
  );
}
