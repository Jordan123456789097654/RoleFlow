"use client";

import React, { useEffect, useState } from "react";

type Role = { rank: number; name: string };

/**
 * Popup shown when a Roblox group ID is entered. Choose which group roles count as staff:
 * only those members appear on the roster, in quotas, and in reports.
 */
export function MonitoredRolesModal({
  guildId,
  groupId,
  initialSelected,
  onSave,
  onClose,
}: {
  guildId: string;
  groupId: string;
  initialSelected: number[];
  onSave: (ranks: number[]) => void;
  onClose: () => void;
}) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetch(`/api/guilds/${guildId}/roblox-roles?groupId=${encodeURIComponent(groupId)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        if (!res.ok) {
          setError(data.error || "Could not load roles.");
          return;
        }
        const list: Role[] = data.roles ?? [];
        setRoles(list);
        const saved: number[] = initialSelected.length ? initialSelected : data.monitored ?? [];
        // First time: monitor every staff role. Otherwise restore the saved choice.
        setSelected(new Set(saved.length ? saved : list.map((r) => r.rank)));
      })
      .catch(() => active && setError("Could not reach Roblox. Try again."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [guildId, groupId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (rank: number) => {
    const next = new Set(selected);
    next.has(rank) ? next.delete(rank) : next.add(rank);
    setSelected(next);
  };

  const save = () => {
    onSave([...selected].sort((a, b) => a - b));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl">
        <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Roblox group {groupId}</p>
        <h2 className="mt-1 text-[18px] font-semibold text-ink">Choose roles to monitor</h2>
        <p className="mt-1 text-[13px] text-muted">
          Only members with these roles appear on the staff roster, in quotas, and in weekly reports.
        </p>

        {loading && <p className="mt-6 text-[13px] text-muted">Loading roles…</p>}
        {error && <p className="mt-6 text-[13px] text-red-700">{error}</p>}

        {!loading && !error && (
          <>
            <div className="mt-4 flex gap-3 text-[12px]">
              <button onClick={() => setSelected(new Set(roles.map((r) => r.rank)))} className="text-accent hover:text-accent-hover">Select all</button>
              <button onClick={() => setSelected(new Set())} className="text-muted hover:text-ink">Clear</button>
            </div>
            <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto">
              {roles.map((r) => (
                <li key={r.rank}>
                  <label className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 hover:bg-sunk">
                    <span className="text-[14px] text-ink">{r.name}</span>
                    <span className="flex items-center gap-3 text-[12px] text-faint">
                      Rank {r.rank}
                      <input type="checkbox" checked={selected.has(r.rank)} onChange={() => toggle(r.rank)} className="h-4 w-4 cursor-pointer accent-[var(--accent)]" />
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            {roles.length === 0 && <p className="mt-4 text-[13px] text-muted">This group has no staff roles.</p>}
          </>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-[14px] text-muted hover:text-ink">Cancel</button>
          <button
            onClick={save}
            disabled={loading || !!error || selected.size === 0}
            className="rounded-lg bg-accent px-4 py-2 text-[14px] font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            Save {selected.size > 0 ? `(${selected.size})` : ""}
          </button>
        </div>
        {!loading && selected.size === 0 && !error && <p className="mt-2 text-right text-[12px] text-muted">Select at least one role.</p>}
      </div>
    </div>
  );
}
