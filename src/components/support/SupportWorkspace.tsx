"use client";

import React, { useEffect, useMemo, useState } from "react";
import ReportDetail, { ReviewQueue } from "@/components/support/ReportDetail";

type Field = { key: string; label: string; kind: "text" | "textarea" | "select" | "checkbox" | "multi"; required?: boolean; options?: string[]; help?: string };
type Template = { id: string; label: string; group: string; description: string; ticket: boolean; subject: boolean; fields: Field[] };
type Tab = "file" | "mine" | "lookup" | "removals" | "all" | "review";

const TABS: { id: Tab; label: string }[] = [
  { id: "file", label: "File a report" },
  { id: "mine", label: "My reports" },
  { id: "lookup", label: "User lookup" },
  { id: "removals", label: "Removal log" },
  { id: "all", label: "All reports" },
  { id: "review", label: "Review queue" },
];

const SUPPORT_ACTIONS = [
  { id: "revokeSessions", label: "Sign out every session" },
  { id: "removeEmail", label: "Remove email address" },
  { id: "removeCompanyEmail", label: "Remove company email" },
  { id: "removeRobloxLink", label: "Remove Roblox link" },
  { id: "removeSavedProfile", label: "Remove saved profile answers" },
  { id: "removeDrafts", label: "Remove server drafts" },
  { id: "removeLoginDevices", label: "Remove recorded devices" },
];
const ADMIN_ACTIONS = [
  { id: "removeApplicationMessages", label: "Remove messages sent on applications" },
  { id: "resetTwoFactor", label: "Reset two-factor authentication" },
  { id: "deleteAccount", label: "Delete account permanently" },
];

const input = "w-full px-3 py-2 rounded-xl bg-surface border border-line text-xs text-ink placeholder-faint focus:outline-none focus:border-accent";
const btn = "px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold disabled:opacity-40";
const ghost = "px-3 py-1.5 rounded-lg bg-surface border border-line text-xs font-semibold text-ink-2 hover:bg-sunk";
const panel = "glass-panel p-5 rounded-2xl space-y-4";

async function api(url: string, init?: RequestInit) {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function fmt(d: string | Date | null | undefined) {
  return d ? new Date(d).toLocaleString() : "-";
}

export default function SupportWorkspace() {
  const [tab, setTab] = useState<Tab>("file");
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    api("/api/support/templates").catch(() => setForbidden(true));
  }, []);

  if (forbidden) {
    return <div className={panel}><p className="text-sm text-ink">You need support staff access to use this workspace.</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-xl text-xs font-semibold border ${tab === t.id ? "bg-accent text-white border-accent" : "bg-surface text-ink-2 border-line hover:bg-sunk"}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "file" && <FileReport />}
      {tab === "mine" && <ReportList mine />}
      {tab === "lookup" && <UserLookup />}
      {tab === "removals" && <RemovalLog />}
      {tab === "all" && <ReportList />}
      {tab === "review" && <ReviewQuoteWrapper />}
    </div>
  );
}

function FileReport() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [ticketRef, setTicketRef] = useState("");
  const [subjectUsername, setSubjectUsername] = useState("");
  const [values, setValues] = useState<Record<string, any>>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/api/support/templates").then((t: Template[]) => {
      setTemplates(t);
      setTemplateId(t[0]?.id ?? "");
    }).catch((e) => setMessage({ ok: false, text: e.message }));
  }, []);

  const tpl = useMemo(() => templates.find((t) => t.id === templateId), [templates, templateId]);
  const groups = useMemo(() => Array.from(new Set(templates.map((t) => t.group))), [templates]);

  function reset() {
    setValues({});
    setTicketRef("");
    setSubjectUsername("");
  }

  async function submit() {
    if (!tpl) return;
    setSaving(true);
    setMessage(null);
    try {
      const out = await api("/api/support/reports", {
        method: "POST",
        body: JSON.stringify({ reportType: tpl.id, ticketRef, subjectUsername, fields: values }),
      });
      setMessage({ ok: true, text: `Report filed (${out.report.id.slice(0, 8)}).` });
      reset();
    } catch (e: any) {
      setMessage({ ok: false, text: e.message });
    } finally {
      setSaving(false);
    }
  }

  function setValue(key: string, v: any) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  return (
    <div className={panel}>
      <div>
        <h3 className="text-base font-bold text-ink">File a report</h3>
        <p className="text-xs text-muted mt-1">File one report for every ticket you handle in Discord, plus any data removal, account change, or escalation. Ticket reports need the Discord ticket reference.</p>
      </div>

      <div>
        <label className="text-[11px] font-semibold text-muted">Report type</label>
        <select className={input} value={templateId} onChange={(e) => { setTemplateId(e.target.value); setValues({}); setMessage(null); }}>
          {groups.map((g) => (
            <optgroup key={g} label={g}>
              {templates.filter((t) => t.group === g).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </optgroup>
          ))}
        </select>
        {tpl && <p className="text-[11px] text-muted mt-1">{tpl.description}</p>}
      </div>

      {tpl && (
        <div className="space-y-4">
          {tpl.ticket && (
            <Labelled label="Discord ticket reference" required help="The ticket channel name or number shown by the bot.">
              <input className={input} value={ticketRef} onChange={(e) => setTicketRef(e.target.value)} placeholder="e.g. ticket-0412" />
            </Labelled>
          )}
          {tpl.subject && (
            <Labelled label="User this is about" required help="Discord username, Roblox username, or user ID.">
              <input className={input} value={subjectUsername} onChange={(e) => setSubjectUsername(e.target.value)} />
            </Labelled>
          )}
          {tpl.fields.map((f) => (
            <Labelled key={f.key} label={f.label} required={f.required} help={f.help}>
              {f.kind === "text" && <input className={input} value={values[f.key] ?? ""} onChange={(e) => setValue(f.key, e.target.value)} />}
              {f.kind === "textarea" && <textarea rows={4} className={input} value={values[f.key] ?? ""} onChange={(e) => setValue(f.key, e.target.value)} />}
              {f.kind === "select" && (
                <select className={input} value={values[f.key] ?? ""} onChange={(e) => setValue(f.key, e.target.value)}>
                  <option value="">Choose...</option>
                  {f.options?.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ").toLowerCase()}</option>)}
                </select>
              )}
              {f.kind === "checkbox" && (
                <label className="flex items-center gap-2 text-xs text-ink-2">
                  <input type="checkbox" checked={values[f.key] === true} onChange={(e) => setValue(f.key, e.target.checked)} />
                  Yes
                </label>
              )}
              {f.kind === "multi" && (
                <div className="grid sm:grid-cols-2 gap-2">
                  {f.options?.map((o) => {
                    const arr: string[] = values[f.key] ?? [];
                    return (
                      <label key={o} className="flex items-center gap-2 text-xs text-ink-2">
                        <input type="checkbox" checked={arr.includes(o)} onChange={(e) => setValue(f.key, e.target.checked ? [...arr, o] : arr.filter((x) => x !== o))} />
                        {o.replace(/_/g, " ").toLowerCase()}
                      </label>
                    );
                  })}
                </div>
              )}
            </Labelled>
          ))}

          {message && <p className={`text-xs ${message.ok ? "text-emerald-500" : "text-danger"}`}>{message.text}</p>}
          <button className={btn} disabled={saving} onClick={submit}>{saving ? "Filing..." : "File report"}</button>
        </div>
      )}
    </div>
  );
}

function Labelled({ label, required, help, children }: { label: string; required?: boolean; help?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-muted">
        {label}{required && <span className="text-danger"> *</span>}
      </label>
      {help && <p className="text-[11px] text-faint">{help}</p>}
      <div className="mt-1">{children}</div>
    </div>
  );
}

function ReportList({ mine = false }: { mine?: boolean }) {
  const [reports, setReports] = useState<any[]>([]);
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { api("/api/support/templates").then(setTemplates).catch(() => {}); }, []);

  async function load() {
    setError(null);
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (q) params.set("q", q);
    if (mine) params.set("mine", "1");
    try {
      const data = await api(`/api/support/reports?${params}`);
      setReports(data.reports);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [type]);

  return (
    <div className={panel}>
      <div className="flex flex-col sm:flex-row gap-3">
        <select className={input} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All report types</option>
          {templates.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <input className={input} placeholder="Search ticket, user, or summary" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
        <button className={ghost} onClick={load}>Search</button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <p className="text-[11px] text-faint">{reports.length} report(s)</p>
      <ul className="divide-y divide-line">
        {reports.map((r) => {
          const tpl = templates.find((t) => t.id === r.reportType);
          const fields = JSON.parse(r.fieldsJson || "{}");
          return (
            <li key={r.id} className="py-3">
              <button className="w-full text-left" onClick={() => setOpen(open === r.id ? null : r.id)}>
                <p className="text-xs font-semibold text-ink">{tpl?.label ?? r.reportType}</p>
                <p className="text-[11px] text-muted">
                  {fmt(r.createdAt)} · {r.authorName ?? "Unknown"}{r.ticketRef ? ` · ticket ${r.ticketRef}` : ""}{r.subjectUsername ? ` · user ${r.subjectUsername}` : ""}
                </p>
                <p className="text-[11px] text-ink-2 mt-0.5 truncate">{r.summary}</p>
              </button>
              {open === r.id && <ReportDetail id={r.id} templates={templates} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function UserLookup() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    setError(null);
    try {
      const data = await api(`/api/support/users?q=${encodeURIComponent(q)}`);
      setResults(data.users);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function open(id: string) {
    setError(null);
    try {
      setSelected(await api(`/api/support/users/${id}`));
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className={panel}>
        <div className="flex gap-3">
          <input className={input} placeholder="Discord ID, username, email, or Roblox username" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} />
          <button className={btn} onClick={search}>Search</button>
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        <ul className="divide-y divide-line">
          {results.map((u) => (
            <li key={u.id}>
              <button className="w-full text-left py-2" onClick={() => open(u.id)}>
                <p className="text-xs font-semibold text-ink">{u.username} <span className="text-faint font-mono">{u.id}</span></p>
                <p className="text-[11px] text-muted">{u.plan}{u.robloxUsername ? ` · Roblox ${u.robloxUsername}` : ""}{u.isBanned ? " · banned" : ""}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {selected && <UserDetail data={selected} onChanged={() => open(selected.user.id)} />}
    </div>
  );
}

function UserDetail({ data, onChanged }: { data: any; onChanged: () => void }) {
  const { user, applications, devices, punishments, ownedGuilds, removals, reports, auditEntries } = data;
  const [pending, setPending] = useState<{ id: string; label: string } | null>(null);
  const [reason, setReason] = useState("");
  const [ticketRef, setTicketRef] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function run() {
    if (!pending) return;
    setMsg(null);
    try {
      const out = await api(`/api/support/users/${user.id}/actions`, {
        method: "POST",
        body: JSON.stringify({ action: pending.id, reason, ticketRef }),
      });
      setMsg({ ok: true, text: `${out.action} done and logged.` });
      setPending(null);
      setReason("");
      onChanged();
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    }
  }

  return (
    <div className="space-y-6">
      <div className={panel}>
        <div className="flex items-center gap-3">
          {user.avatar && <img src={user.avatar} alt="" className="w-10 h-10 rounded-full" />}
          <div>
            <p className="text-sm font-bold text-ink">{user.username}</p>
            <p className="text-[11px] font-mono text-faint">{user.id}</p>
          </div>
        </div>
        <dl className="grid sm:grid-cols-2 gap-2 text-[11px]">
          <Row k="Email" v={user.email ?? "none"} />
          <Row k="Email notifications" v={user.emailNotifications ? "on" : "off"} />
          <Row k="Company email" v={user.companyEmail ?? "none"} />
          <Row k="Roblox" v={user.robloxUsername ?? "not linked"} />
          <Row k="Plan" v={`${user.plan}${user.planExpiresAt ? ` until ${fmt(user.planExpiresAt)}` : ""}`} />
          <Row k="Role" v={user.siteRole ?? "USER"} />
          <Row k="Two-factor" v={user.totpEnabled ? "enabled" : "off"} />
          <Row k="Banned" v={user.isBanned ? "yes" : "no"} />
          <Row k="Saved profile" v={user.hasSavedProfile ? "yes" : "no"} />
          <Row k="Joined" v={fmt(user.createdAt)} />
          <Row k="Owns communities" v={String(ownedGuilds.length)} />
          <Row k="Applications" v={String(applications.length)} />
        </dl>
      </div>

      <div className={panel}>
        <h4 className="text-xs font-bold text-ink">Actions</h4>
        <p className="text-[11px] text-muted">Each action needs a reason and is written to the removal log and the audit log.</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {SUPPORT_ACTIONS.map((a) => <button key={a.id} className={ghost} onClick={() => { setPending(a); setMsg(null); }}>{a.label}</button>)}
        </div>
        <p className="text-[11px] font-semibold text-muted pt-2">Site admins only</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {ADMIN_ACTIONS.map((a) => <button key={a.id} className={`${ghost} text-danger`} onClick={() => { setPending(a); setMsg(null); }}>{a.label}</button>)}
        </div>

        {pending && (
          <div className="p-4 rounded-xl bg-sunk space-y-3">
            <p className="text-xs font-semibold text-ink">{pending.label} for {user.username}?</p>
            <input className={input} placeholder="Ticket reference (optional)" value={ticketRef} onChange={(e) => setTicketRef(e.target.value)} />
            <textarea rows={3} className={input} placeholder="Reason (at least 10 characters). Recorded in the removal log." value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="flex gap-2">
              <button className={btn} disabled={reason.trim().length < 10} onClick={run}>Confirm</button>
              <button className={ghost} onClick={() => setPending(null)}>Cancel</button>
            </div>
          </div>
        )}
        {msg && <p className={`text-xs ${msg.ok ? "text-emerald-500" : "text-danger"}`}>{msg.text}</p>}
      </div>

      <Section title={`Removal log (${removals.length})`}>
        {removals.map((r: any) => <Line key={r.id} left={`${r.item} · ${r.method.replace(/_/g, " ").toLowerCase()}`} right={`${fmt(r.createdAt)} · ${r.actorName ?? ""}`} sub={r.reason} />)}
      </Section>
      <Section title={`Reports about this user (${reports.length})`}>
        {reports.map((r: any) => <Line key={r.id} left={r.reportType} right={fmt(r.createdAt)} sub={r.summary} />)}
      </Section>
      <Section title={`Recent applications (${applications.length})`}>
        {applications.map((a: any) => <Line key={a.id} left={`${a.position?.title ?? "Position"} · ${a.position?.guild?.name ?? ""}`} right={a.status} sub={fmt(a.createdAt)} />)}
      </Section>
      <Section title={`Punishments (${punishments.length})`}>
        {punishments.map((p: any) => <Line key={p.id} left={p.action} right={fmt(p.createdAt)} sub={p.reason} />)}
      </Section>
      <Section title={`Recorded devices (${devices.length})`}>
        {devices.map((d: any) => <Line key={d.id} left={`First seen ${fmt(d.createdAt)}`} right={`Last seen ${fmt(d.lastSeenAt)}`} />)}
      </Section>
      <Section title={`Audit trail (${auditEntries.length})`}>
        {auditEntries.map((a: any) => <Line key={a.id} left={a.action} right={fmt(a.createdAt)} sub={a.details ?? ""} />)}
      </Section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="p-2 rounded-lg bg-sunk"><dt className="font-semibold text-muted">{k}</dt><dd className="text-ink-2">{v}</dd></div>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className={panel}><h4 className="text-xs font-bold text-ink">{title}</h4><ul className="divide-y divide-line">{children}</ul></div>;
}
function Line({ left, right, sub }: { left: string; right: string; sub?: string }) {
  return (
    <li className="py-2">
      <p className="text-xs text-ink flex justify-between gap-3"><span className="font-semibold">{left}</span><span className="text-muted text-[11px] text-right">{right}</span></p>
      {sub && <p className="text-[11px] text-muted truncate">{sub}</p>}
    </li>
  );
}

function RemovalLog() {
  const [entries, setEntries] = useState<any[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [subject, setSubject] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ subject: "", item: "email", reason: "", ticketRef: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function load() {
    setError(null);
    try {
      const data = await api(`/api/support/data-removal-log${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`);
      setEntries(data.entries);
      setLabels(data.labels);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function record() {
    setMsg(null);
    try {
      await api("/api/support/data-removal-log", { method: "POST", body: JSON.stringify(form) });
      setMsg({ ok: true, text: "Removal recorded." });
      setForm({ subject: "", item: "email", reason: "", ticketRef: "" });
      load();
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    }
  }

  return (
    <div className="space-y-6">
      <div className={panel}>
        <div className="flex gap-3">
          <input className={input} placeholder="Filter by user" value={subject} onChange={(e) => setSubject(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
          <button className={ghost} onClick={load}>Filter</button>
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        <ul className="divide-y divide-line">
          {entries.map((e) => (
            <li key={e.id} className="py-2">
              <p className="text-xs text-ink flex justify-between gap-3">
                <span className="font-semibold">{e.subjectUsername ?? e.subjectUserId} · {labels[e.item] ?? e.item}</span>
                <span className="text-[11px] text-muted">{fmt(e.createdAt)}</span>
              </p>
              <p className="text-[11px] text-muted">{e.method.replace(/_/g, " ").toLowerCase()} · by {e.actorName ?? "unknown"}{e.ticketRef ? ` · ticket ${e.ticketRef}` : ""}</p>
              <p className="text-[11px] text-ink-2">{e.reason}</p>
            </li>
          ))}
          {entries.length === 0 && <li className="py-3 text-xs text-faint">No removals recorded.</li>}
        </ul>
      </div>

      <div className={panel}>
        <h4 className="text-xs font-bold text-ink">Record a removal done elsewhere</h4>
        <p className="text-[11px] text-muted">Use this when data was removed outside the workspace, so the log stays complete.</p>
        <input className={input} placeholder="User (username or ID)" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        <select className={input} value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })}>
          {Object.entries(labels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input className={input} placeholder="Ticket reference (optional)" value={form.ticketRef} onChange={(e) => setForm({ ...form, ticketRef: e.target.value })} />
        <textarea rows={3} className={input} placeholder="Reason (at least 10 characters)" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        <button className={btn} disabled={form.reason.trim().length < 10 || !form.subject.trim()} onClick={record}>Record removal</button>
        {msg && <p className={`text-xs ${msg.ok ? "text-emerald-500" : "text-danger"}`}>{msg.text}</p>}
      </div>
    </div>
  );
}

function ReviewQuoteWrapper() {
  const [templates, setTemplates] = useState<Template[]>([]);
  useEffect(() => { api("/api/support/templates").then(setTemplates).catch(() => {}); }, []);
  return <ReviewQueue templates={templates} />;
}
