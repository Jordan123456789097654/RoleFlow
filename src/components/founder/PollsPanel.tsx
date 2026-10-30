"use client";

import { useEffect, useState } from "react";

type PollRow = {
  id: string;
  question: string;
  description: string | null;
  status: string;
  allowOther: boolean;
  otherLabel: string;
  closesAt: string | null;
  createdAt: string;
  totalVotes: number;
  options: { id: string; label: string; votes: number }[];
  otherResponses: { text: string | null; at: string }[];
};

const card = "rounded-2xl border border-line bg-surface p-5 space-y-4";
const input = "w-full rounded-lg border border-line bg-sunk px-3 py-2 text-sm text-ink outline-none focus:border-accent";
const small = "rounded-lg border border-line bg-sunk px-2.5 py-1 text-xs font-semibold text-ink-2 hover:bg-surface disabled:opacity-40";
const danger = "rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-500/20";

export default function PollsPanel() {
  const [polls, setPolls] = useState<PollRow[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [optionsText, setOptionsText] = useState("");
  const [allowOther, setAllowOther] = useState(true);
  const [otherLabel, setOtherLabel] = useState("Something else");
  const [closesAt, setClosesAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/founder/polls");
    if (!res.ok) return;
    const d = await res.json();
    setPolls(d.polls);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/founder/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        description,
        options: optionsText.split("\n"),
        allowOther,
        otherLabel,
        closesAt: closesAt ? new Date(closesAt).toISOString() : null,
      }),
    });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setMsg({ ok: false, text: d.error || "Could not create the poll." });
    setMsg({ ok: true, text: "Poll is live on /polls." });
    setQuestion(""); setDescription(""); setOptionsText(""); setClosesAt("");
    load();
  };

  const setStatus = async (id: string, status: "OPEN" | "CLOSED") => {
    await fetch("/api/founder/polls", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    load();
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this poll and every vote on it? This cannot be undone.")) return;
    await fetch(`/api/founder/polls?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <section className={card}>
      <div>
        <h3 className="text-sm font-bold text-ink">Community polls</h3>
        <p className="text-xs text-muted mt-1">Create a poll for /polls. One option per line. Turn on "something else" to let people write their own answer; those answers appear below each poll.</p>
      </div>

      <div className="space-y-3 rounded-xl border border-line p-4">
        <input className={input} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Question, e.g. What would you like to see next?" maxLength={200} />
        <textarea rows={2} className={input} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description (optional)" maxLength={1000} />
        <textarea rows={5} className={`${input} font-mono text-xs`} value={optionsText} onChange={(e) => setOptionsText(e.target.value)} placeholder={"Option one\nOption two\nOption three"} />
        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={allowOther} onChange={(e) => setAllowOther(e.target.checked)} />
            Allow an "other" answer
          </label>
          {allowOther && <input className={`${input} w-56`} value={otherLabel} onChange={(e) => setOtherLabel(e.target.value)} maxLength={60} placeholder="Other label" />}
          <label className="flex items-center gap-2">
            Closes (optional)
            <input type="datetime-local" className={`${input} w-auto`} value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
          </label>
        </div>
        <button onClick={create} disabled={saving || !question.trim()} className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-40">
          {saving ? "Creating..." : "Create poll"}
        </button>
        {msg && <p className={`text-xs ${msg.ok ? "text-emerald-500" : "text-rose-500"}`}>{msg.text}</p>}
      </div>

      <div className="space-y-2">
        {polls.length === 0 && <p className="text-xs text-muted">No polls yet.</p>}
        {polls.map((p) => (
          <div key={p.id} className="rounded-xl border border-line px-4 py-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex-1 text-sm font-semibold text-ink">{p.question}</span>
              <span className="text-[11px] font-mono text-muted">{p.status} · {p.totalVotes} votes</span>
              {p.status === "OPEN"
                ? <button className={small} onClick={() => setStatus(p.id, "CLOSED")}>Close</button>
                : <button className={small} onClick={() => setStatus(p.id, "OPEN")}>Reopen</button>}
              <button className={small} onClick={() => setOpenId(openId === p.id ? null : p.id)}>{openId === p.id ? "Hide results" : "Results"}</button>
              <button className={danger} onClick={() => remove(p.id)}>Delete</button>
            </div>
            {openId === p.id && (
              <div className="space-y-2 pt-1">
                {p.options.map((o) => (
                  <div key={o.id} className="flex justify-between text-xs text-ink-2"><span>{o.label}</span><span>{o.votes}</span></div>
                ))}
                {p.allowOther && (
                  <div className="pt-2 space-y-1">
                    <p className="text-[11px] font-semibold text-muted">{p.otherLabel}: {p.otherResponses.length} written answers</p>
                    {p.otherResponses.map((r, i) => (
                      <p key={i} className="rounded-lg bg-sunk px-3 py-2 text-xs text-ink-2">{r.text}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
