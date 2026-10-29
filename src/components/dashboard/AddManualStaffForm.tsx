"use client";

import React, { useState } from "react";

type RoleOption = { rank: number; name: string };

const inputClass = "w-full rounded-lg border border-line bg-transparent px-3 py-2 text-[14px] text-ink";

/**
 * Adds a staff member by hand. Works without a Roblox group: pick "Manual staff" for the rank.
 * A Roblox account is required. A Discord ID is optional.
 */
export function AddManualStaffForm({ guildId, roles }: { guildId: string; roles: RoleOption[] }) {
  const [displayName, setDisplayName] = useState("");
  const [robloxUserId, setRobloxUserId] = useState("");
  const [rank, setRank] = useState("0");
  const [roleTitle, setRoleTitle] = useState("");
  const [discordUserId, setDiscordUserId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/guilds/${guildId}/staff/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, robloxUserId, robloxRankId: Number(rank), roleTitle, discordUserId }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setDisplayName("");
      setRobloxUserId("");
      setDiscordUserId("");
      setMsg({ ok: true, text: `Added ${data.robloxName ?? "staff member"}.` });
    } else {
      setMsg({ ok: false, text: data.error || "Could not add." });
    }
  }

  const options: RoleOption[] = [{ rank: 0, name: "Manual staff (no Roblox group)" }, ...roles.filter((r) => r.rank > 0)];

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={inputClass} placeholder="Name shown on the roster" maxLength={64} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <input className={inputClass} placeholder="Roblox user ID (required)" inputMode="numeric" value={robloxUserId} onChange={(e) => setRobloxUserId(e.target.value)} />
        <select className={inputClass} value={rank} onChange={(e) => setRank(e.target.value)}>
          {options.map((o) => <option key={o.rank} value={o.rank}>{o.name}{o.rank > 0 ? ` (rank ${o.rank})` : ""}</option>)}
        </select>
        <input className={inputClass} placeholder="Role title (optional)" maxLength={64} value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} />
        <input className={inputClass} placeholder="Discord ID (optional, lets them sign in)" inputMode="numeric" value={discordUserId} onChange={(e) => setDiscordUserId(e.target.value)} />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={busy || !displayName.trim() || !robloxUserId.trim()}
          className="rounded-lg bg-accent px-4 py-2 text-[14px] font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {busy ? "Adding…" : "Add staff member"}
        </button>
        {msg && <span className={`text-[13px] ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</span>}
      </div>
    </div>
  );
}
