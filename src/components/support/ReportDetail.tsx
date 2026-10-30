"use client";

import React, { useEffect, useState } from "react";

type Field = { key: string; label: string; kind: string; options?: string[] };
type Template = { id: string; label: string; fields: Field[]; ticket: boolean; subject: boolean };
type Report = {
  id: string; reportType: string; ticketRef: string | null; subjectUsername: string | null; subjectUserId: string | null;
  authorId: string; authorName: string | null; fieldsJson: string; summary: string; createdAt: string;
  reviewStatus: string; reviewChecklist: string | null; reviewedByName: string | null; reviewedAt: string | null; reviewNote: string | null;
};
type Event = { id: string; action: string; actorName: string | null; note: string | null; createdAt: string };

const CHECKS = [
  "The facts in this report match the Discord ticket",
  "Every required answer is accurate and complete",
  "Any data removal was authorised and the identity check was done",
];

const STATUS_STYLE: Record<string, string> = {
  PENDING_REVIEW: "bg-amber-500/15 text-amber-600",
  VERIFIED: "bg-emerald-500/15 text-emerald-600",
  REJECTED: "bg-rose-500/15 text-rose-600",
  NEEDS_CHANGES: "bg-sky-500/15 text-sky-600",
};

const input = "w-full px-3 py-2 rounded-xl bg-surface border border-line text-xs text-ink focus:outline-none focus:border-accent";
const btn = "px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold disabled:opacity-40";
const ghost = "px-3 py-1.5 rounded-lg bg-surface border border-line text-xs font-semibold text-ink-2 hover:bg-sunk";

function fmt(d: string | null | undefined) {
  return d ? new Date(d).toLocaleString() : "-";
}

/** Full record of one report: every answer, the review status, and the complete history. Reviewers see decision controls. */
export default function ReportDetail({ id, templates, canReviewHint = false, onChanged }: { id: string; templates: Template[]; canReviewHint?: boolean; onChanged?: () => void }) {
  const [data, setData] = useState<{ report: Report; events: Event[]; viewerId: string; viewerIsAdmin: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checks, setChecks] = useState<boolean[]>([false, false, false]);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await fetch(`/api/support/reports/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load report");
      setData(json);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  if (error) return <p className="text-xs text-danger">{error}</p>;
  if (!data) return <p className="text-xs text-muted">Loading report...</p>;

  const { report, events, viewerId, viewerIsAdmin } = data;
  const tpl = templates.find((t) => t.id === report.reportType);
  const answers = JSON.parse(report.fieldsJson || "{}") as Record<string, any>;
  const isAuthor = viewerId === report.authorId;
  const canReview = (viewerIsAdmin || canReviewHint) && !isAuthor && report.reviewStatus === "PENDING_REVIEW";

  async function decide(decision: "VERIFIED" | "REJECTED" | "NEEDS_CHANGES") {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/support/reports/${report.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note, checklist: checks }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not record the decision");
      setMsg({ ok: true, text: "Decision recorded and posted to the reports channel." });
      setNote("");
      setChecks([false, false, false]);
      await load();
      onChanged?.();
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${STATUS_STYLE[report.reviewStatus] ?? ""}`}>
          {report.reviewStatus.replace(/_/g, " ").toLowerCase()}
        </span>
        <span className="text-[11px] font-mono text-faint">{report.id}</span>
      </div>

      <dl className="grid sm:grid-cols-2 gap-2 text-[11px]">
        <Row k="Report type" v={tpl?.label ?? report.reportType} />
        <Row k="Filed by" v={report.authorName ?? "unknown"} />
        <Row k="Filed at" v={fmt(report.createdAt)} />
        <Row k="Discord ticket" v={report.ticketRef ?? "none"} />
        <Row k="User" v={report.subjectUsername ?? "none"} />
        <Row k="Linked account" v={report.subjectUserId ?? "not matched"} />
      </dl>

      <div className="space-y-2">
        <h5 className="text-[11px] font-bold text-muted uppercase tracking-wide">Answers</h5>
        <dl className="grid sm:grid-cols-2 gap-2 text-[11px]">
          {(tpl?.fields ?? Object.keys(answers).map((k) => ({ key: k, label: k, kind: "text" }))).map((f) => {
            const v = answers[f.key];
            const shown = Array.isArray(v) ? (v.length ? v.join(", ") : "none") : typeof v === "boolean" ? (v ? "Yes" : "No") : v ? String(v) : "-";
            return <Row key={f.key} k={f.label} v={shown} wide={f.kind === "textarea"} />;
          })}
        </dl>
      </div>

      {report.reviewStatus !== "PENDING_REVIEW" && (
        <div className="p-3 rounded-xl bg-sunk text-[11px] space-y-1">
          <p className="text-ink-2"><span className="font-semibold">Reviewed by</span> {report.reviewedByName ?? "-"} on {fmt(report.reviewedAt)}</p>
          {report.reviewNote && <p className="text-ink-2"><span className="font-semibold">Note</span> {report.reviewNote}</p>}
        </div>
      )}

      {canReview && (
        <div className="p-4 rounded-xl bg-sunk space-y-3">
          <p className="text-xs font-bold text-ink">Review this report</p>
          <p className="text-[11px] text-muted">Check the report against the Discord ticket and the account before you decide. You cannot review a report you filed.</p>
          <div className="space-y-2">
            {CHECKS.map((c, i) => (
              <label key={c} className="flex items-start gap-2 text-[11px] text-ink-2">
                <input type="checkbox" className="mt-0.5" checked={checks[i]} onChange={(e) => setChecks(checks.map((v, j) => (j === i ? e.target.checked : v)))} />
                {c}
              </label>
            ))}
          </div>
          <textarea rows={3} className={input} placeholder="Note for the author. Required to reject or ask for changes." value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <button className={btn} disabled={busy || checks.some((c) => !c)} onClick={() => decide("VERIFIED")}>Verify</button>
            <button className={ghost} disabled={busy || note.trim().length < 10} onClick={() => decide("NEEDS_CHANGES")}>Needs changes</button>
            <button className={`${ghost} text-danger`} disabled={busy || note.trim().length < 10} onClick={() => decide("REJECTED")}>Reject</button>
          </div>
          {msg && <p className={`text-xs ${msg.ok ? "text-emerald-500" : "text-danger"}`}>{msg.text}</p>}
        </div>
      )}
      {!canReview && msg && <p className={`text-xs ${msg.ok ? "text-emerald-500" : "text-danger"}`}>{msg.text}</p>}

      <div className="space-y-2">
        <h5 className="text-[11px] font-bold text-muted uppercase tracking-wide">History</h5>
        <ol className="space-y-2 border-l border-line pl-4">
          {events.map((e) => (
            <li key={e.id} className="text-[11px]">
              <p className="text-ink-2"><span className="font-semibold">{e.action.replace(/_/g, " ").toLowerCase()}</span> by {e.actorName ?? "unknown"} · {fmt(e.createdAt)}</p>
              {e.note && <p className="text-muted">{e.note}</p>}
            </li>
          ))}
          {events.length === 0 && <li className="text-[11px] text-faint">No history recorded for this report.</li>}
        </ol>
      </div>
    </div>
  );
}

function Row({ k, v, wide }: { k: string; v: string; wide?: boolean }) {
  return (
    <div className={`p-2 rounded-lg bg-sunk ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="font-semibold text-muted">{k}</dt>
      <dd className="text-ink-2 whitespace-pre-wrap">{v}</dd>
    </div>
  );
}

/** Administrator queue: every report waiting for a decision, oldest first. */
export function ReviewQueue({ templates }: { templates: Template[] }) {
  const [reports, setReports] = useState<any[]>([]);
  const [status, setStatus] = useState("PENDING_REVIEW");
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const res = await fetch(`/api/support/reviews?status=${status}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load the queue");
      setReports(json.reports);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status]);

  return (
    <div className="glass-panel p-5 rounded-2xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {["PENDING_REVIEW", "VERIFIED", "REJECTED", "NEEDS_CHANGES"].map((s) => (
          <button key={s} onClick={() => { setStatus(s); setOpen(null); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${status === s ? "bg-accent text-white border-accent" : "bg-surface text-ink-2 border-line"}`}>
            {s.replace(/_/g, " ").toLowerCase()}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <p className="text-[11px] text-faint">{reports.length} report(s)</p>
      <ul className="divide-y divide-line">
        {reports.map((r) => {
          const tpl = templates.find((t) => t.id === r.reportType);
          return (
            <li key={r.id} className="py-3">
              <button className="w-full text-left" onClick={() => setOpen(open === r.id ? null : r.id)}>
                <p className="text-xs font-semibold text-ink">{tpl?.label ?? r.reportType}</p>
                <p className="text-[11px] text-muted">{new Date(r.createdAt).toLocaleString()} · filed by {r.authorName ?? "unknown"}{r.ticketRef ? ` · ticket ${r.ticketRef}` : ""}</p>
                <p className="text-[11px] text-ink-2 truncate">{r.summary}</p>
              </button>
              {open === r.id && <ReportDetail id={r.id} templates={templates} canReviewHint onChanged={load} />}
            </li>
          );
        })}
        {reports.length === 0 && !error && <li className="py-4 text-xs text-faint">Nothing here.</li>}
      </ul>
    </div>
  );
}
