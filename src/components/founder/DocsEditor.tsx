"use client";

import { useEffect, useState } from "react";

const card = "rounded-2xl border border-line bg-surface p-5 space-y-3";
const input = "w-full rounded-lg border border-line bg-sunk px-3 py-2 text-sm text-ink outline-none focus:border-accent";

type Doc = { slug: string; title: string; body: string; updatedAt: string | null; stored: boolean };

export default function DocsEditor() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [slug, setSlug] = useState("support-handbook");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = async () => {
    const res = await fetch("/api/founder/docs");
    if (!res.ok) return;
    const data = await res.json();
    setDocs(data.docs);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const d = docs.find((x) => x.slug === slug);
    if (d) { setTitle(d.title); setBody(d.body); }
  }, [slug, docs]);

  const save = async () => {
    if (!confirm("Save changes? Support staff will see them right away.")) return;
    setMsg(null);
    const res = await fetch("/api/founder/docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, title, body }),
    });
    const data = await res.json();
    if (!res.ok) { setMsg({ ok: false, text: data.error || "Save failed" }); return; }
    setMsg({ ok: true, text: "Saved." });
    load();
  };

  return (
    <section className={card}>
      <div>
        <h3 className="text-sm font-bold text-ink">Support handbook and documentation</h3>
        <p className="text-xs text-muted mt-1">
          Write one section per "## Heading" line. Lines starting with "- " become bullets. Other lines are paragraphs. Support staff see changes right away.
        </p>
      </div>
      <div className="flex gap-2">
        {docs.map((d) => (
          <button key={d.slug} onClick={() => setSlug(d.slug)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${slug === d.slug ? "bg-purple-600 text-white" : "bg-sunk text-ink-2"}`}>
            {d.slug === "support-handbook" ? "Support handbook" : "Documentation"}
          </button>
        ))}
      </div>
      <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
      <textarea rows={18} className={`${input} font-mono text-xs`} value={body} onChange={(e) => setBody(e.target.value)} />
      <button onClick={save} disabled={!title.trim() || !body.trim()} className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-40">Save document</button>
      {msg && <p className={`text-xs ${msg.ok ? "text-emerald-500" : "text-rose-500"}`}>{msg.text}</p>}
    </section>
  );
}
