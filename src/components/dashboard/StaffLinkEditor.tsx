"use client";

import React, { useState } from "react";

type Member = { userId: string; username: string; robloxUserId: string | null; robloxRankId: number | null };
type Role = { rank: number; name: string };
type Week = { weekStart: string; minutes: number };

export function StaffLinkEditor({ guildId, members, roles }: { guildId: string; members: Member[]; roles: Role[] }) {
  return (
    <div className="mt-10">
      <p className="text-[14px] font-medium text-ink">Link staff to Roblox</p>
      <p className="mt-1 text-[13px] text-muted">
        Enter each staff member's Roblox user ID and their current group rank. Only linked accounts are tracked.
      </p>
      <div className="mt-4 space-y-4">
        {members.map((m) => (
          <StaffLinkRow key={m.userId} guildId={guildId} member={m} roles={roles} />
        ))}
        {members.length === 0 && <p className="text-[14px] text-muted">No staff yet.</p>}
      </div>
    </div>
  );
}

function StaffLinkRow({ guildId, member, roles }: { guildId: string; member: Member; roles: Role[] }) {
  const [robloxUserId, setRobloxUserId] = useState(member.robloxUserId ?? "");
  const [rank, setRank] = useState(member.robloxRankId == null ? "" : String(member.robloxRankId));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [history, setHistory] = useState<Week[] | null>(null);

  async function save() {
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/guilds/${guildId}/staff/${member.userId}/roblox`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        robloxUserId: robloxUserId.trim() || null,
        robloxRankId: rank === "" ? null : Number(rank),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setMessage(res.ok ? { ok: true, text: "Saved." } : { ok: false, text: data.error || "Could not save." });
  }

  async function toggleHistory() {
    if (history) return setHistory(null);
    const res = await fetch(`/api/guilds/${guildId}/staff/${member.userId}/history?weeks=8`);
    const data = await res.json().catch(() => ({ weeks: [] }));
    setHistory(data.weeks ?? []);
  }

  const max = Math.max(60, ...(history ?? []).map((w) => w.minutes));

  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-[140px] text-[14px] text-ink">{member.username}</span>
        <input
          value={robloxUserId}
          onChange={(e) => setRobloxUserId(e.target.value)}
          placeholder="Roblox user ID (required)"
          inputMode="numeric"
          className="w-44 rounded-lg border border-line bg-transparent px-3 py-2 text-[14px] text-ink"
        />
        <select
          value={rank}
          onChange={(e) => setRank(e.target.value)}
          className="rounded-lg border border-line bg-transparent px-3 py-2 text-[14px] text-ink"
        >
          <option value="0">Manual staff (no Roblox group)</option>
          {roles
            .filter((r) => r.rank > 0)
            .map((r) => (
              <option key={r.rank} value={r.rank}>
                {r.name} (rank {r.rank})
              </option>
            ))}
        </select>
        <button
          onClick={save}
          disabled={busy || !robloxUserId.trim()}
          className="rounded-lg bg-accent px-3 py-2 text-[13px] font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <button onClick={toggleHistory} className="text-[13px] text-muted hover:text-ink">
          {history ? "Hide history" : "History"}
        </button>
        {message && <span className={`text-[13px] ${message.ok ? "text-green-700" : "text-red-700"}`}>{message.text}</span>}
      </div>

      {history && (
        <div className="mt-4 space-y-1.5">
          {history.length === 0 && <p className="text-[13px] text-muted">No history yet.</p>}
          {history.map((w) => (
            <div key={w.weekStart} className="flex items-center gap-3 text-[12px] text-muted">
              <span className="w-24">{w.weekStart.slice(0, 10)}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-sunk">
                <div className="h-full bg-accent" style={{ width: `${(w.minutes / max) * 100}%` }} />
              </div>
              <span className="w-14 text-right">{Math.floor(w.minutes / 60)}h {w.minutes % 60}m</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
