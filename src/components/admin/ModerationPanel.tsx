"use client";

import { useEffect, useState } from "react";

const card = "rounded-2xl border border-white/10 bg-white/[0.02] p-5";
const input = "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-purple-500";
const btn = "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40";

export default function ModerationPanel() {
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const note = (ok: boolean, text: string) => setNotice({ ok, text });

  return (
    <div className="space-y-6">
      {notice && (
        <div className={`rounded-xl border p-3 text-sm ${notice.ok ? "border-emerald-500/30 text-emerald-300" : "border-rose-500/30 text-rose-300"}`}>
          {notice.text}
        </div>
      )}
      <PunishForm onDone={note} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <BulkCommunities onDone={note} />
        <ReportsQueue onDone={note} />
      </div>
      <AppealsQueue onDone={note} />
    </div>
  );
}

function PunishForm({ onDone }: { onDone: (ok: boolean, text: string) => void }) {
  const [targetType, setTargetType] = useState<"USER" | "GUILD">("USER");
  const [targetId, setTargetId] = useState("");
  const [action, setAction] = useState("WARNING");
  const [days, setDays] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const actions = targetType === "USER" ? ["WARNING", "SUSPENSION", "BAN"] : ["PAUSE", "BLACKLIST"];

  const submit = async (lift: boolean) => {
    setBusy(true);
    const res = await fetch("/api/admin/punish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId: targetId.trim(), action: actions.includes(action) ? action : actions[0], days: days || null, reason, lift }),
    });
    const data = await res.json();
    setBusy(false);
    onDone(res.ok, res.ok ? (lift ? "Punishment lifted." : "Punishment issued and the user or community notified.") : data.error);
    if (res.ok && !lift) setReason("");
  };

  return (
    <section className={card}>
      <h3 className="mb-1 text-sm font-bold text-white">Punish a user or community</h3>
      <p className="mb-4 text-xs text-slate-400">Bans and suspensions end active sessions and email the user an appeal link. Pausing hides a community from the public directory.</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <select value={targetType} onChange={(e) => { setTargetType(e.target.value as any); setAction(e.target.value === "USER" ? "WARNING" : "PAUSE"); }} className={input}>
          <option value="USER">User (Discord ID)</option>
          <option value="GUILD">Community (server ID)</option>
        </select>
        <input value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder="Discord ID" className={input} />
        <select value={action} onChange={(e) => setAction(e.target.value)} className={input}>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        {action === "SUSPENSION" && (
          <input value={days} onChange={(e) => setDays(e.target.value)} placeholder="Days (blank = indefinite)" inputMode="numeric" className={input} />
        )}
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (shown to the target)" rows={2} className={`${input} md:col-span-2 xl:col-span-3`} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button disabled={busy || !targetId || !reason.trim()} onClick={() => submit(false)} className={`${btn} bg-rose-600 hover:bg-rose-500 text-white`}>Issue {action.toLowerCase()}</button>
        <button disabled={busy || !targetId} onClick={() => submit(true)} className={`${btn} bg-white/5 hover:bg-white/10 text-slate-200`}>Lift active punishment</button>
      </div>
    </section>
  );
}

function BulkCommunities({ onDone }: { onDone: (ok: boolean, text: string) => void }) {
  const [guilds, setGuilds] = useState<{ id: string; name: string; isPaused: boolean }[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [query, setQuery] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin/guilds");
    if (!res.ok) return;
    const data = await res.json();
    setGuilds(Array.isArray(data) ? data : data.guilds || []);
  };
  useEffect(() => { load(); }, []);

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const run = async (action: "PAUSE" | "UNPAUSE" | "BLACKLIST") => {
    const res = await fetch("/api/admin/guilds/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected, action, reason }),
    });
    const data = await res.json();
    onDone(res.ok, res.ok ? `${action.toLowerCase()} applied to ${data.processed} communities.` : data.error);
    if (res.ok) { setSelected([]); load(); }
  };

  const shown = guilds.filter((g) => g.name.toLowerCase().includes(query.toLowerCase())).slice(0, 100);

  return (
    <section className={card}>
      <h3 className="mb-3 text-sm font-bold text-white">Bulk community actions</h3>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter communities" className={`${input} mb-3`} />
      <div className="max-h-72 overflow-y-auto divide-y divide-white/5 rounded-lg border border-white/5">
        {shown.map((g) => (
          <label key={g.id} className="flex items-center gap-3 px-3 py-2 text-xs text-slate-200">
            <input type="checkbox" checked={selected.includes(g.id)} onChange={() => toggle(g.id)} />
            <span className="flex-1 truncate">{g.name}</span>
            {g.isPaused && <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">PAUSED</span>}
          </label>
        ))}
      </div>
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (for blacklist)" className={`${input} mt-3`} />
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="self-center text-xs text-slate-400">{selected.length} selected</span>
        <button disabled={!selected.length} onClick={() => run("PAUSE")} className={`${btn} bg-amber-600 hover:bg-amber-500 text-white`}>Pause</button>
        <button disabled={!selected.length} onClick={() => run("UNPAUSE")} className={`${btn} bg-white/5 hover:bg-white/10 text-slate-200`}>Unpause</button>
        <button disabled={!selected.length} onClick={() => run("BLACKLIST")} className={`${btn} bg-rose-600 hover:bg-rose-500 text-white`}>Blacklist</button>
      </div>
    </section>
  );
}

function ReportsQueue({ onDone }: { onDone: (ok: boolean, text: string) => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const load = async () => {
    const res = await fetch("/api/admin/reports");
    if (res.ok) setRows(await res.json());
  };
  useEffect(() => { load(); }, []);

  const close = async (targetType: string, targetId: string, decision: "DISMISS" | "ACTION") => {
    const res = await fetch("/api/admin/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, decision }),
    });
    onDone(res.ok, res.ok ? "Reports closed." : "Could not close reports.");
    if (res.ok) load();
  };

  return (
    <section className={card}>
      <h3 className="mb-1 text-sm font-bold text-white">Content reports</h3>
      <p className="mb-3 text-xs text-slate-400">Sorted by how many different people reported each target.</p>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-500">No open reports.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={`${r.targetType}:${r.targetId}`} className="rounded-lg border border-white/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-white">{r.targetName}</div>
                  <div className="text-[11px] text-slate-500">{r.targetType} · {r.targetId}</div>
                </div>
                <span className="shrink-0 rounded-md bg-rose-500/20 px-2 py-0.5 text-xs font-bold text-rose-300">{r.distinctReporters} reporter{r.distinctReporters === 1 ? "" : "s"}</span>
              </div>
              <ul className="mt-2 list-disc pl-4 text-[11px] text-slate-400">
                {r.reasons.map((x: string, i: number) => <li key={i}>{x}</li>)}
              </ul>
              <div className="mt-2 flex gap-2">
                <button onClick={() => close(r.targetType, r.targetId, "ACTION")} className={`${btn} bg-rose-600 hover:bg-rose-500 text-white`}>Mark actioned</button>
                <button onClick={() => close(r.targetType, r.targetId, "DISMISS")} className={`${btn} bg-white/5 hover:bg-white/10 text-slate-200`}>Dismiss</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AppealsQueue({ onDone }: { onDone: (ok: boolean, text: string) => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const load = async () => {
    const res = await fetch("/api/admin/appeals");
    if (res.ok) setRows(await res.json());
  };
  useEffect(() => { load(); }, []);

  const decide = async (punishmentId: string, decision: "APPROVE" | "DENY") => {
    const res = await fetch("/api/admin/appeals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ punishmentId, decision, note: notes[punishmentId] || "" }),
    });
    const data = await res.json();
    onDone(res.ok, res.ok ? `Appeal ${decision === "APPROVE" ? "approved" : "denied"}.` : data.error);
    if (res.ok) load();
  };

  return (
    <section className={card}>
      <h3 className="mb-3 text-sm font-bold text-white">Appeals ({rows.length})</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-500">No pending appeals.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((a) => (
            <li key={a.id} className="rounded-lg border border-white/5 p-4">
              <div className="text-xs text-slate-400">
                <span className="font-semibold text-white">{a.targetName}</span> · {a.targetType} · {a.action} · appealed {new Date(a.appealedAt).toLocaleString()}
              </div>
              <div className="mt-2 text-xs text-slate-300"><span className="text-slate-500">Original reason:</span> {a.reason}</div>
              <div className="mt-2 rounded-lg bg-black/30 p-3 text-xs text-slate-200 whitespace-pre-wrap">{a.appealText}</div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input value={notes[a.id] || ""} onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })} placeholder="Note to the user (optional)" className={input} />
                <button onClick={() => decide(a.id, "APPROVE")} className={`${btn} bg-emerald-600 hover:bg-emerald-500 text-white shrink-0`}>Approve</button>
                <button onClick={() => decide(a.id, "DENY")} className={`${btn} bg-white/5 hover:bg-white/10 text-slate-200 shrink-0`}>Deny</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
