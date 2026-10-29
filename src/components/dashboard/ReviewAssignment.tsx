"use client";

import { useState } from "react";

type Staff = { userId: string; username: string };

const field = "w-full rounded-lg border border-line bg-sunk px-3 py-2 text-xs text-ink outline-none focus:border-accent";

export function AssignmentPanel({
  applicationId,
  staff,
  initial,
}: {
  applicationId: string;
  staff: Staff[];
  initial: { assignedReviewerId: string | null; reviewDueAt: string | null; needsSecondOpinion: boolean };
}) {
  const [reviewer, setReviewer] = useState(initial.assignedReviewerId ?? "");
  const [due, setDue] = useState(initial.reviewDueAt ? initial.reviewDueAt.slice(0, 10) : "");
  const [second, setSecond] = useState(initial.needsSecondOpinion);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/applications/${applicationId}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewerId: reviewer || null, reviewDueAt: due || null, needsSecondOpinion: second }),
    });
    const data = await res.json();
    setSaving(false);
    setMessage(res.ok ? "Saved." : data.error || "Could not save.");
  };

  const overdue = due && new Date(due) < new Date(new Date().toDateString());

  return (
    <div className="p-4 rounded-xl bg-surface border border-line space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink">Review assignment</span>
        {overdue && <span className="text-[10px] font-semibold text-danger">Overdue</span>}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select value={reviewer} onChange={(e) => setReviewer(e.target.value)} className={field}>
          <option value="">Unassigned</option>
          {staff.map((s) => <option key={s.userId} value={s.userId}>{s.username}</option>)}
        </select>
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={field} />
      </div>
      <label className="flex items-center gap-2 text-xs text-ink-2">
        <input type="checkbox" checked={second} onChange={(e) => setSecond(e.target.checked)} />
        Needs a second opinion
      </label>
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50">
          {saving ? "Saving..." : "Save assignment"}
        </button>
        {message && <span className="text-xs text-muted">{message}</span>}
      </div>
    </div>
  );
}

export function BulkAssignControl({ applicationIds, staff }: { applicationIds: string[]; staff: Staff[] }) {
  const [reviewer, setReviewer] = useState("");
  const [due, setDue] = useState("");
  const [second, setSecond] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  if (applicationIds.length === 0) return null;

  const apply = async () => {
    const res = await fetch("/api/applications/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guildId: window.location.pathname.split("/").pop(),
        applicationIds,
        action: "ASSIGN",
        reviewerId: reviewer || null,
        reviewDueAt: due || null,
        needsSecondOpinion: second,
      }),
    });
    const data = await res.json();
    if (!res.ok) return setMessage(data.error || "Could not assign.");
    setMessage(`Assigned ${data.updated} application${data.updated === 1 ? "" : "s"}.`);
    window.location.reload();
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-purple-500/30 bg-purple-500/5 p-3">
      <span className="text-xs font-semibold text-ink">{applicationIds.length} selected</span>
      <select value={reviewer} onChange={(e) => setReviewer(e.target.value)} className={`${field} w-auto`}>
        <option value="">Unassign</option>
        {staff.map((s) => <option key={s.userId} value={s.userId}>{s.username}</option>)}
      </select>
      <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={`${field} w-auto`} />
      <label className="flex items-center gap-1.5 text-xs text-ink-2">
        <input type="checkbox" checked={second} onChange={(e) => setSecond(e.target.checked)} /> Second opinion
      </label>
      <button onClick={apply} className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-500">Apply to selected</button>
      {message && <span className="text-xs text-ink-2">{message}</span>}
    </div>
  );
}
