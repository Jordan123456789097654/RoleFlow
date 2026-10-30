"use client";

import React, { useEffect, useState } from "react";

type Field = { key: string; label: string; kind: string; options?: string[] };
type Template = { id: string; label: string; fields: Field[]; ticket: boolean; subject: boolean };
type Report = {
  id: string; reportType: string; ticketRef: string | null; subjectUsername: string | null; subjectUserId: string | null;
  authorId: string; authorName: string | null; fieldsJson: string; summary: string; createdAt: string;
  reviewStatus: string; reviewedByName: string | null; reviewedAt: string | null; reviewNote: string | null;
  redactedFields: string | null; parentReportId: string | null;
};
type Brief = { id: string; reportType: string; summary: string; authorName: string | null; createdAt: string; reviewStatus: string };
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
const ghost = "px-3 py-1.5 rounded-lg bg-surface border border-line text-xs font-semibold text-ink-2 hover:bg-sunk disabled:opacity-40";

function fmt(d: string | null | undefined) {
  return d ? new Date(d).toLocaleString() : "-";
}

/** Full record of one report: answers, review status, history, links, and (for administrators) redaction and review. */
export default function ReportDetail({ id, templates, canReviewHint = false, onChanged }: { id: string; templates: Template[]; canReviewHint?: boolean; onChanged?: () => void }) {
  const [trail, setTrail] = useState<string[]>([id]);
  const activeId = trail[trail.length - 1];
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [checks, setChecks] = useState<boolean[]>([false, false, false]);
  const [note, setNote] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [redactReason, setRedactReason] = useState("");
  const [linkQuery, setLinkQuery] = useState("");
  const [linkResults, setLinkResults] = useState<Brief[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load(reportId = activeId) {
    setError(null);
    try {
      const res = await fetch(`/api/support/reports/${reportId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load report");
      setData(json);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => { load(activeId); setPicked([]); setMsg(null); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [activeId]);

  if (error) return <p className="text-xs text-danger">{error}</p>;
  if (!data) return <p className="text-xs text-muted">Loading report...</p>;

  const { report, events, parent, children, viewerId, viewerIsAdmin } = data as {
    report: Report; events: Event[]; parent: Brief | null; children: Brief[]; viewerId: string; viewerIsAdmin: boolean;
  };
  const tpl = templates.find((t) => t.id === report.reportType);
  const answers = JSON.parse(report.fieldsJson || "{}") as Record<string, any>;
  const redacted = JSON.parse(report.redactedFields || "[]") as string[];
  const isAuthor = viewerId === report.authorId;
  const canReview = (viewerIsAdmin || canReviewHint) && !isAuthor && report.reviewStatus === "PENDING_REVIEW";
  const redactable = (tpl?.fields ?? []).filter((f) => ["text", "textarea", "select"].includes(f.kind) && !redacted.includes(f.key));
  const canLink = isAuthor || viewerIsAdmin;

  async function call(url: string, body: unknown, okText: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong");
      setMsg({ ok: true, text: okText });
      await load(activeId);
      onChanged?.();
      return json;
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  }

  const TICKET_STATES: { value: string; label: string; active: string }[] = [
    { value: "OPEN", label: "Open", active: "bg-sunk text-ink border-line" },
    { value: "IN_PROGRESS", label: "In progress", active: "bg-sky-600 text-white border-sky-600" },
    { value: "WAITING_ON_USER", label: "Waiting on user", active: "bg-amber-500 text-white border-amber-500" },
    { value: "RESOLVED", label: "Resolved", active: "bg-emerald-600 text-white border-emerald-600" },
    { value: "CLOSED", label: "Closed", active: "bg-zinc-600 text-white border-zinc-600" },
  ];

  function setTicketStatus(value: string) {
    call(`/api/support/reports/${report.id}/status`, { status: value, note: statusNote }, "Ticket status updated.").then((r) => {
      if (r) setStatusNote("");
    });
  }

  function decide(decision: "VERIFIED" | "REJECTED" | "NEEDS_CHANGES") {
    call(`/api/support/reports/${report.id}/review`, { decision, note, checklist: checks }, "Decision recorded and posted to the reports channel.").then((r) => {
      if (r) { setNote(""); setChecks([false, false, false]); }
    });
  }

  function redact() {
    if (!window.confirm(`Permanently remove ${picked.length} answer(s)? The values cannot be recovered afterwards.`)) return;
    call(`/api/support/reports/${report.id}/redact`, { fields: picked, reason: redactReason }, "Answers redacted. The history records who did it and why.").then((r) => {
      if (r) { setPicked([]); setRedactReason(""); }
    });
  }

  async function searchLinks(q: string) {
    setLinkQuery(q);
    if (q.trim().length < 2) return setLinkResults([]);
    const res = await fetch(`/api/support/reports?q=${encodeURIComponent(q.trim())}`);
    const json = await res.json();
    if (res.ok) setLinkResults((json.reports as Brief[]).filter((r) => r.id !== report.id).slice(0, 8));
  }

  function link(parentId: string | null) {
    call(`/api/support/reports/${report.id}/link`, { parentId }, parentId ? "Linked." : "Link removed.").then((r) => {
      if (r) { setLinkQuery(""); setLinkResults([]); }
    });
  }

  return (
    <div className="space-y-5 pt-3">
      {trail.length > 1 && (
        <button className={ghost} onClick={() => setTrail(trail.slice(0, -1))}>Back</button>
      )}

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

      <div className="space-y-2 p-3 rounded-xl bg-sunk">
        <h5 className="text-[11px] font-bold text-muted uppercase tracking-wide">Ticket status</h5>
        <div className="flex flex-wrap gap-1.5">
          {TICKET_STATES.map((s) => {
            const isActive = (report.workflowStatus ?? "OPEN") === s.value;
            return (
              <button
                key={s.value}
                type="button"
                aria-pressed={isActive}
                disabled={busy || isActive}
                onClick={() => setTicketStatus(s.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all disabled:cursor-default ${isActive ? s.active : "bg-surface text-ink-2 border-line hover:bg-sunk"}`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <input
          className="w-full px-3 py-2 rounded-xl bg-surface border border-line text-xs text-ink placeholder-faint focus:outline-none focus:border-accent"
          placeholder="Optional note for the history (what changed and why)"
          value={statusNote}
          onChange={(e) => setStatusNote(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <h5 className="text-[11px] font-bold text-muted uppercase tracking-wide">Answers</h5>
        {redacted.length > 0 && <p className="text-[11px] text-amber-600">{redacted.length} answer(s) redacted.</p>}
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

      <div className="space-y-2">
        <h5 className="text-[11px] font-bold text-muted uppercase tracking-wide">Linked reports</h5>
        {parent && (
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-sunk text-[11px]">
            <span className="text-ink-2">Follows up on: <span className="font-semibold">{parent.summary || parent.reportType}</span> · {fmt(parent.createdAt)}</span>
            <span className="flex gap-2">
              <button className={ghost} onClick={() => setTrail([...trail, parent.id])}>Open</button>
              {canLink && <button className={ghost} disabled={busy} onClick={() => link(null)}>Unlink</button>}
            </span>
          </div>
        )}
        {children.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-sunk text-[11px]">
            <span className="text-ink-2">Follow-up: <span className="font-semibold">{c.summary || c.reportType}</span> · {fmt(c.createdAt)}</span>
            <button className={ghost} onClick={() => setTrail([...trail, c.id])}>Open</button>
          </div>
        ))}
        {!parent && children.length === 0 && <p className="text-[11px] text-faint">Not linked to any report.</p>}
        {canLink && (
          <div className="space-y-2">
            <input className={input} placeholder="Search a report to link to (ticket, user, or summary)" value={linkQuery} onChange={(e) => searchLinks(e.target.value)} />
            {linkResults.map((r) => (
              <button key={r.id} className="w-full text-left p-2 rounded-lg bg-surface border border-line text-[11px]" disabled={busy} onClick={() => link(r.id)}>
                <span className="font-semibold text-ink">{r.summary || r.reportType}</span>
                <span className="text-muted"> · {r.authorName ?? "unknown"} · {fmt(r.createdAt)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {viewerIsAdmin && redactable.length > 0 && (
        <div className="p-4 rounded-xl bg-sunk space-y-3">
          <p className="text-xs font-bold text-ink">Redact answers</p>
          <p className="text-[11px] text-muted">Removes the values permanently. Use this for verification codes, personal details that should not be kept, or anything filed by mistake. The history keeps the field name and your reason, not the value.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {redactable.map((f) => (
              <label key={f.key} className="flex items-center gap-2 text-[11px] text-ink-2">
                <input type="checkbox" checked={picked.includes(f.key)} onChange={(e) => setPicked(e.target.checked ? [...picked, f.key] : picked.filter((k) => k !== f.key))} />
                {f.label}
              </label>
            ))}
          </div>
          <textarea rows={2} className={input} placeholder="Reason for redacting (at least 10 characters)" value={redactReason} onChange={(e) => setRedactReason(e.target.value)} />
          <button className={`${ghost} text-danger`} disabled={busy || picked.length === 0 || redactReason.trim().length < 10} onClick={redact}>Redact selected answers</button>
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
        </div>
      )}

      {msg && <p className={`text-xs ${msg.ok ? "text-emerald-500" : "text-danger"}`}>{msg.text}</p>}

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

/** Administrator queue: reports waiting for a decision, oldest first. */
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
