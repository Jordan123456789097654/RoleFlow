"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type Section = { title: string; paragraphs: (string | string[])[] };
type Policy = { slug: string; title: string; subtitle: string; updated: string; sections: Section[]; customised: boolean; customisedAt: string | null };

const PUBLIC_PATHS: Record<string, string> = {
  privacy: "/privacy",
  terms: "/terms",
  "acceptable-use": "/acceptable-use",
  "community-guidelines": "/community-guidelines",
  cookies: "/cookies",
};

const input = "w-full px-3 py-2 rounded-xl bg-surface border border-line text-xs text-ink focus:outline-none focus:border-accent";
const btn = "px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold disabled:opacity-40";
const POLICY_SLUGS = ["privacy", "terms", "acceptable-use", "community-guidelines", "cookies"];
const ghost = "px-3 py-1.5 rounded-lg bg-surface border border-line text-xs font-semibold text-ink-2 hover:bg-sunk";

/** Paragraphs are separated by blank lines. Lines starting with "- " become bullets. */
function toText(s: Section): string {
  return s.paragraphs.map((p) => (Array.isArray(p) ? p.map((x) => `- ${x}`).join("\n") : p)).join("\n\n");
}
function fromText(text: string): (string | string[])[] {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.split("\n").map((l) => l.trim()).filter(Boolean))
    .filter((lines) => lines.length)
    .map((lines) => (lines.every((l) => l.startsWith("- ")) ? lines.map((l) => l.slice(2)) : lines.join(" ")));
}

export default function FounderPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [slug, setSlug] = useState("privacy");
  const [draft, setDraft] = useState<Policy | null>(null);
  const [texts, setTexts] = useState<string[]>([]);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonMsg, setJsonMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function loadAll() {
    const res = await fetch("/api/founder/policies");
    if (res.status === 403) return setForbidden(true);
    const data = await res.json();
    setPolicies(data.policies);
  }

  async function loadOne(s: string) {
    const p = policies.find((x) => x.slug === s);
    if (!p) return;
    setDraft(JSON.parse(JSON.stringify(p)));
    setTexts(p.sections.map(toText));
    const res = await fetch(`/api/founder/policies/${s}`);
    const data = await res.json();
    setRevisions(data.revisions ?? []);
  }

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { if (policies.length) loadOne(slug); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [slug, policies.length]);

  if (forbidden) return <div className="page-wrap py-16"><p className="text-sm text-ink">Only the founder can edit policies.</p></div>;
  if (!draft) return <div className="page-wrap py-16"><p className="text-sm text-muted">Loading...</p></div>;

  function setSection(i: number, patch: Partial<Section>) {
    setDraft((d) => d && { ...d, sections: d.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (!draft || j < 0 || j >= draft.sections.length) return;
    const sections = [...draft.sections];
    [sections[i], sections[j]] = [sections[j], sections[i]];
    const t = [...texts];
    [t[i], t[j]] = [t[j], t[i]];
    setDraft({ ...draft, sections });
    setTexts(t);
  }
  function remove(i: number) {
    if (!draft || !window.confirm(`Remove the section "${draft.sections[i].title}"?`)) return;
    setDraft({ ...draft, sections: draft.sections.filter((_, j) => j !== i) });
    setTexts(texts.filter((_, j) => j !== i));
  }
  function add() {
    if (!draft) return;
    setDraft({ ...draft, sections: [...draft.sections, { title: "New section", paragraphs: ["Write the text here."] }] });
    setTexts([...texts, "Write the text here."]);
  }

  function currentPayload() {
    if (!draft) return null;
    const sections = draft.sections.map((sec, i) => ({ title: sec.title, paragraphs: fromText(texts[i] ?? "") }));
    return { title: draft.title, subtitle: draft.subtitle, updated: draft.updated, sections };
  }

  function loadCurrentIntoBox() {
    const payload = currentPayload();
    if (!payload) return;
    setJsonText(JSON.stringify(payload, null, 2));
    setJsonMsg({ ok: true, text: "Current text copied into the box. Edit it, then import to publish." });
  }

  function downloadCurrent() {
    const payload = currentPayload();
    if (!payload) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function loadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((t) => { setJsonText(t); setJsonMsg({ ok: true, text: `Loaded ${file.name}. Check it, then import.` }); });
  }

  async function importJson() {
    setJsonMsg(null);
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err: any) {
      return setJsonMsg({ ok: false, text: `That is not valid JSON: ${err.message}` });
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return setJsonMsg({ ok: false, text: "The JSON must be an object." });
    }

    // One policy (has sections), or a bundle keyed by slug: { "privacy": {...}, "terms": {...} }
    const isSingle = "sections" in parsed;
    const targets: [string, any][] = isSingle
      ? [[slug, parsed]]
      : Object.entries(parsed).filter(([k]) => POLICY_SLUGS.includes(k));
    if (targets.length === 0) {
      return setJsonMsg({ ok: false, text: `No policy found. Use a policy object with "sections", or keys from: ${POLICY_SLUGS.join(", ")}.` });
    }

    const names = targets.map(([k]) => k).join(", ");
    if (!window.confirm(`Publish ${names}? This replaces the current text on the public pages. Previous versions are kept in history.`)) return;

    for (const [s2, body] of targets) {
      const res = await fetch(`/api/founder/policies/${s2}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return setJsonMsg({ ok: false, text: `${s2}: ${data.error || "invalid"}. Nothing after it was published.` });
      }
    }
    setJsonText("");
    setJsonMsg({ ok: true, text: `Published ${names}. Reloading...` });
    setTimeout(() => window.location.reload(), 600);
  }

  async function save() {
    if (!draft) return;
    setMsg(null);
    const sections = draft.sections.map((s, i) => ({ title: s.title, paragraphs: fromText(texts[i] ?? "") }));
    const res = await fetch(`/api/founder/policies/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: draft.title, subtitle: draft.subtitle, updated: draft.updated, sections }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg({ ok: false, text: data.error });
    setMsg({ ok: true, text: "Saved. The public page now shows this version." });
    await loadAll();
  }

  async function resetToDefault() {
    if (!window.confirm("Go back to the built-in text? The current version is kept in history.")) return;
    await fetch(`/api/founder/policies/${slug}`, { method: "DELETE" });
    setMsg({ ok: true, text: "Reset to the built-in text." });
    await loadAll();
  }

  async function restore(revisionId: string) {
    if (!window.confirm("Restore this earlier version? The current version is kept in history.")) return;
    const res = await fetch(`/api/founder/policies/${slug}/restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revisionId }),
    });
    const data = await res.json();
    setMsg(res.ok ? { ok: true, text: "Restored." } : { ok: false, text: data.error });
    await loadAll();
  }

  return (
    <div className="page-wrap py-12 sm:py-16 space-y-8">
      <div>
        <Link href="/founder" className="text-[13px] text-muted hover:text-ink">← Founder Master Command Console</Link>
        <p className="eyebrow mb-3 mt-4">Founder</p>
        <h1 className="display-md">Policy editor</h1>
        <p className="mt-3 text-sm text-muted max-w-2xl">Changes go live on the public page as soon as you save. Every save keeps the previous version so you can restore it.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {policies.map((p) => (
          <button key={p.slug} onClick={() => setSlug(p.slug)} className={`px-4 py-2 rounded-xl text-xs font-semibold border ${slug === p.slug ? "bg-accent text-white border-accent" : "bg-surface text-ink-2 border-line"}`}>
            {p.title}{p.customised ? " *" : ""}
          </button>
        ))}
      </div>

      <details className="glass-panel p-5 rounded-2xl space-y-4">
        <summary className="cursor-pointer text-sm font-semibold text-ink">Import and export as JSON</summary>
        <p className="text-[12px] text-muted">
          Edit a policy outside the browser and publish it here. Paragraphs are strings. A list of strings is a bulleted list.
          A file with one policy object updates the policy open above. A file keyed by slug ({POLICY_SLUGS.join(", ")}) updates several at once.
        </p>
        <div className="flex flex-wrap gap-2">
          <button className={ghost} onClick={loadCurrentIntoBox}>Load current text into box</button>
          <button className={ghost} onClick={downloadCurrent}>Download {slug}.json</button>
          <label className={`${ghost} cursor-pointer`}>
            Choose JSON file
            <input type="file" accept=".json,application/json" className="hidden" onChange={loadFile} />
          </label>
        </div>
        <textarea
          rows={12}
          className={`${input} font-mono`}
          placeholder={'{\n  "title": "Privacy Policy",\n  "subtitle": "...",\n  "updated": "October 29, 2026",\n  "sections": [\n    { "title": "Who we are", "paragraphs": ["First paragraph.", ["Bullet one", "Bullet two"]] }\n  ]\n}'}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button className={btn} disabled={!jsonText.trim()} onClick={importJson}>Import and publish</button>
          <button className={ghost} onClick={() => { setJsonText(""); setJsonMsg(null); }}>Clear</button>
        </div>
        {jsonMsg && <p className={`text-xs ${jsonMsg.ok ? "text-emerald-500" : "text-danger"}`}>{jsonMsg.text}</p>}
      </details>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <input className={input} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Title" />
            <input className={input} value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} placeholder="Subtitle" />
            <input className={input} value={draft.updated} onChange={(e) => setDraft({ ...draft, updated: e.target.value })} placeholder="Last updated, e.g. October 29, 2026" />
          </div>

          {draft.sections.map((s, i) => (
            <div key={i} className="glass-panel p-5 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-faint">{String(i + 1).padStart(2, "0")}</span>
                <input className={input} value={s.title} onChange={(e) => setSection(i, { title: e.target.value })} />
                <button className={ghost} onClick={() => move(i, -1)} disabled={i === 0}>Up</button>
                <button className={ghost} onClick={() => move(i, 1)} disabled={i === draft.sections.length - 1}>Down</button>
                <button className={`${ghost} text-danger`} onClick={() => remove(i)}>Remove</button>
              </div>
              <textarea rows={8} className={input} value={texts[i] ?? ""} onChange={(e) => setTexts(texts.map((t, j) => (j === i ? e.target.value : t)))} />
              <p className="text-[11px] text-faint">Separate paragraphs with a blank line. Start lines with "- " to make a bulleted list.</p>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-3">
            <button className={ghost} onClick={add}>Add section</button>
            <button className={btn} onClick={save}>Save and publish</button>
            <button className={`${ghost} text-danger`} onClick={resetToDefault}>Reset to built-in text</button>
            <a className={ghost} href={PUBLIC_PATHS[slug]} target="_blank" rel="noreferrer">View public page</a>
          </div>
          {msg && <p className={`text-xs ${msg.ok ? "text-emerald-500" : "text-danger"}`}>{msg.text}</p>}
        </div>

        <aside className="glass-panel p-5 rounded-2xl space-y-3 h-fit">
          <h3 className="text-xs font-bold text-ink">Version history</h3>
          <p className="text-[11px] text-muted">{draft.customised ? "This policy has custom text." : "Showing the built-in text."}</p>
          <ul className="divide-y divide-line">
            {revisions.map((r) => (
              <li key={r.id} className="py-2 space-y-1">
                <p className="text-[11px] text-ink-2">{new Date(r.createdAt).toLocaleString()}</p>
                <p className="text-[11px] text-muted truncate">{r.title} · {r.updated}</p>
                <button className={ghost} onClick={() => restore(r.id)}>Restore</button>
              </li>
            ))}
            {revisions.length === 0 && <li className="py-2 text-[11px] text-faint">No earlier versions yet.</li>}
          </ul>
        </aside>
      </div>
    </div>
  );
}
