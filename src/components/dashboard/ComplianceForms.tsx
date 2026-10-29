"use client";

import React, { useState } from "react";

const CATEGORY_LABELS: Record<string, string> = {
  POWER_ABUSE: "Power abuse",
  HINT_EXPLOITATION: "Hint exploitation",
  ACTIVITY_FABRICATION: "Activity fabrication",
  OTHER: "Other",
};

type Member = { userId: string; username: string };

function Notice({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return <span className={`text-[13px] ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</span>;
}

const inputClass = "w-full rounded-lg border border-line bg-transparent px-3 py-2 text-[14px] text-ink";
const buttonClass =
  "rounded-lg bg-accent px-4 py-2 text-[14px] font-medium text-white hover:bg-accent-hover disabled:opacity-50";

async function post(url: string, method: string, body: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, error: data.error as string | undefined };
}

export function AnnouncementForm({ guildId }: { guildId: string }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [hardGate, setHardGate] = useState(false);
  const [readSeconds, setReadSeconds] = useState(10);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    if (hardGate && !window.confirm("Hard-gated notices block every staff member's dashboard until they acknowledge it. Continue?")) return;
    setBusy(true);
    const r = await post(`/api/guilds/${guildId}/announcements`, "POST", { title, body, hardGate, readSeconds });
    setBusy(false);
    if (r.ok) {
      setTitle("");
      setBody("");
      setMsg({ ok: true, text: "Announcement posted." });
    } else setMsg({ ok: false, text: r.error || "Could not post." });
  }

  return (
    <div className="space-y-3">
      <input className={inputClass} placeholder="Title" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className={inputClass} rows={4} placeholder="Message (plain text)" maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="flex flex-wrap items-center gap-4 text-[13px] text-muted">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={hardGate} onChange={(e) => setHardGate(e.target.checked)} />
          Hard gate (must acknowledge)
        </label>
        <label className="flex items-center gap-2">
          Minimum read time
          <input type="number" min={0} max={120} value={readSeconds} onChange={(e) => setReadSeconds(Number(e.target.value))} className="w-20 rounded-lg border border-line bg-transparent px-2 py-1 text-ink" />
          seconds
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={submit} disabled={busy || !title || !body} className={buttonClass}>{busy ? "Posting…" : "Post announcement"}</button>
        <Notice msg={msg} />
      </div>
    </div>
  );
}

export function InfractionForm({ guildId, members }: { guildId: string; members: Member[] }) {
  const [staffUserId, setStaffUserId] = useState(members[0]?.userId ?? "");
  const [category, setCategory] = useState("OTHER");
  const [points, setPoints] = useState(1);
  const [note, setNote] = useState("");
  const [evidence, setEvidence] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    setBusy(true);
    const evidenceUrls = evidence.split("\n").map((u) => u.trim()).filter(Boolean);
    const r = await post(`/api/guilds/${guildId}/infractions`, "POST", { staffUserId, category, points, note, evidenceUrls });
    setBusy(false);
    if (r.ok) {
      setNote("");
      setEvidence("");
      setMsg({ ok: true, text: "Infraction logged." });
    } else setMsg({ ok: false, text: r.error || "Could not log." });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <select className={inputClass} value={staffUserId} onChange={(e) => setStaffUserId(e.target.value)}>
          {members.map((m) => <option key={m.userId} value={m.userId}>{m.username}</option>)}
        </select>
        <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input className={inputClass} type="number" min={1} max={10} value={points} onChange={(e) => setPoints(Number(e.target.value))} aria-label="Strike points" />
      </div>
      <textarea className={inputClass} rows={3} placeholder="What happened" maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
      <textarea className={inputClass} rows={2} placeholder="Evidence links (https, one per line, up to 5)" value={evidence} onChange={(e) => setEvidence(e.target.value)} />
      <div className="flex items-center gap-3">
        <button onClick={submit} disabled={busy || !note || !staffUserId} className={buttonClass}>{busy ? "Logging…" : "Log infraction"}</button>
        <Notice msg={msg} />
      </div>
    </div>
  );
}

export function ManualLogRequestForm({ guildId }: { guildId: string }) {
  const [description, setDescription] = useState("");
  const [minutes, setMinutes] = useState(60);
  const [workedAt, setWorkedAt] = useState("");
  const [shiftType, setShiftType] = useState("MANUAL");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    setBusy(true);
    const r = await post(`/api/guilds/${guildId}/manual-logs`, "POST", {
      description, minutes, shiftType, workedAt: new Date(workedAt).toISOString(),
    });
    setBusy(false);
    if (r.ok) {
      setDescription("");
      setMsg({ ok: true, text: "Request sent for review." });
    } else setMsg({ ok: false, text: r.error || "Could not send." });
  }

  return (
    <div className="space-y-3">
      <textarea className={inputClass} rows={2} placeholder="What did you work on? (design, mapping, training prep…)" maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="grid gap-3 sm:grid-cols-3">
        <input className={inputClass} type="datetime-local" value={workedAt} onChange={(e) => setWorkedAt(e.target.value)} aria-label="When it happened" />
        <input className={inputClass} type="number" min={1} max={720} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} aria-label="Minutes" />
        <select className={inputClass} value={shiftType} onChange={(e) => setShiftType(e.target.value)}>
          <option value="MANUAL">Back-office work</option>
          <option value="TRAINING">Training</option>
          <option value="EVENT">Event</option>
        </select>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={submit} disabled={busy || !description || !workedAt} className={buttonClass}>{busy ? "Sending…" : "Request manual log"}</button>
        <Notice msg={msg} />
      </div>
    </div>
  );
}

export function ManualLogDecision({ guildId, reqId }: { guildId: string; reqId: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function decide(decision: "APPROVE" | "DENY") {
    setBusy(true);
    const r = await post(`/api/guilds/${guildId}/manual-logs/${reqId}`, "PUT", { decision });
    setBusy(false);
    setDone(r.ok ? (decision === "APPROVE" ? "Approved" : "Denied") : r.error || "Failed");
  }

  if (done) return <span className="text-[13px] text-muted">{done}</span>;
  return (
    <div className="flex gap-2">
      <button disabled={busy} onClick={() => decide("APPROVE")} className="rounded-lg bg-green-700 px-3 py-1.5 text-[13px] text-white hover:bg-green-600 disabled:opacity-50">Approve</button>
      <button disabled={busy} onClick={() => decide("DENY")} className="rounded-lg border border-line px-3 py-1.5 text-[13px] text-ink hover:bg-sunk disabled:opacity-50">Deny</button>
    </div>
  );
}
