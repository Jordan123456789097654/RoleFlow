"use client";

import React, { useState } from "react";

interface PositionRow {
  id: string;
  title: string;
  isOpen: boolean;
  opensAt: string | null;
  closesAt: string | null;
  maxApplications: number | null;
  waitlistEnabled: boolean;
  applicationCount: number;
}

interface Initial {
  guildId: string;
  announcement: string;
  autoArchiveDays: number;
  robloxRequiredAssetId: string;
  interviewVoice: boolean;
  positions: PositionRow[];
}

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

type Msg = { ok: boolean; text: string } | null;

function PositionCard({ p }: { p: PositionRow }) {
  const [opensAt, setOpensAt] = useState(toLocalInput(p.opensAt));
  const [closesAt, setClosesAt] = useState(toLocalInput(p.closesAt));
  const [max, setMax] = useState(p.maxApplications ? String(p.maxApplications) : "");
  const [waitlist, setWaitlist] = useState(p.waitlistEnabled);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/positions/${p.id}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opensAt: opensAt ? new Date(opensAt).toISOString() : null,
          closesAt: closesAt ? new Date(closesAt).toISOString() : null,
          maxApplications: max ? Number(max) : null,
          waitlistEnabled: waitlist,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setMsg(res.ok ? { ok: true, text: "Saved." } : { ok: false, text: data.error || "Could not save." });
    } catch {
      setMsg({ ok: false, text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-ink">{p.title}</h3>
        <span className="chip">{p.applicationCount} application{p.applicationCount === 1 ? "" : "s"}</span>
      </div>
      {!p.isOpen && <p className="text-[12px] text-muted">This position is manually closed, so the schedule has no effect until you reopen it.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">Opens at</span>
          <input type="datetime-local" className="field" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} />
          <span className="hint">Leave empty to open immediately.</span>
        </label>
        <label className="block">
          <span className="label">Closes at</span>
          <input type="datetime-local" className="field" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
          <span className="hint">Leave empty for no deadline.</span>
        </label>
        <label className="block">
          <span className="label">Application cap</span>
          <input type="number" min={1} max={10000} className="field" value={max} onChange={(e) => setMax(e.target.value)} placeholder="Unlimited" />
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-[13px] text-ink-2">
          <input type="checkbox" checked={waitlist} disabled={!max} onChange={(e) => setWaitlist(e.target.checked)} />
          Keep accepting after the cap (waitlist)
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" className="btn-accent btn-sm" onClick={save} disabled={busy}>
          {busy ? "Saving..." : "Save schedule"}
        </button>
        {msg && <span className={msg.ok ? "text-[12px] text-moss" : "error-text"}>{msg.text}</span>}
      </div>
    </div>
  );
}

export function AutomationForm({ initial }: { initial: Initial }) {
  const [announcement, setAnnouncement] = useState(initial.announcement);
  const [archiveDays, setArchiveDays] = useState(String(initial.autoArchiveDays));
  const [assetId, setAssetId] = useState(initial.robloxRequiredAssetId);
  const [voice, setVoice] = useState(initial.interviewVoice);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  async function saveCommunity() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/guilds/${initial.guildId}/extras`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          announcement,
          autoArchiveDays: Number(archiveDays || 0),
          robloxRequiredAssetId: assetId,
          interviewVoice: voice,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setMsg(res.ok ? { ok: true, text: "Saved." } : { ok: false, text: data.error || "Could not save." });
    } catch {
      setMsg({ ok: false, text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 space-y-10">
      <section className="space-y-4">
        <h2 className="display-md !text-[22px]">Community</h2>
        <div className="card space-y-4 p-5">
          <label className="block">
            <span className="label">Announcement</span>
            <textarea className="field min-h-[80px]" maxLength={500} value={announcement} onChange={(e) => setAnnouncement(e.target.value)} placeholder="Shown at the top of your community page. Leave empty to hide." />
            <span className="hint">{announcement.length}/500</span>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label">Auto-archive decided applications after (days)</span>
              <input type="number" min={0} max={365} className="field" value={archiveDays} onChange={(e) => setArchiveDays(e.target.value)} />
              <span className="hint">0 keeps everything on the board. Needs the daily archive job (see README).</span>
            </label>
            <label className="block">
              <span className="label">Required Roblox item ID</span>
              <input className="field" inputMode="numeric" value={assetId} onChange={(e) => setAssetId(e.target.value)} placeholder="Asset or Game Pass ID" />
              <span className="hint">Applicants must own it. Their Roblox inventory has to be public.</span>
            </label>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-ink-2">
            <input type="checkbox" checked={voice} onChange={(e) => setVoice(e.target.checked)} />
            Also create a private voice channel for interviews (needs an interview category set in Bot Settings)
          </label>
          <div className="flex items-center gap-3">
            <button type="button" className="btn-accent btn-sm" onClick={saveCommunity} disabled={busy}>
              {busy ? "Saving..." : "Save community settings"}
            </button>
            {msg && <span className={msg.ok ? "text-[12px] text-moss" : "error-text"}>{msg.text}</span>}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="display-md !text-[22px]">Position schedules and caps</h2>
        {initial.positions.length === 0 ? (
          <p className="text-[14px] text-muted">No positions yet. Create one in the Form Builder first.</p>
        ) : (
          initial.positions.map((p) => <PositionCard key={p.id} p={p} />)
        )}
      </section>
    </div>
  );
}
