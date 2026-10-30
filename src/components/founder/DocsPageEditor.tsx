"use client";

import { useEffect, useState } from "react";

type Section = { id: string; title: string; intro?: string; steps?: string[]; body?: string[]; tips?: string[] };
type Group = { title: string; sections: Section[] };
type Revision = { id: string; createdAt: string; editorId: string; groups: Group[] };

const card = "rounded-2xl border border-line bg-surface p-5 space-y-4";
const input = "w-full rounded-lg border border-line bg-sunk px-3 py-2 text-sm text-ink outline-none focus:border-accent";
const area = `${input} font-mono text-xs`;
const small = "rounded-lg border border-line bg-sunk px-2.5 py-1 text-xs font-semibold text-ink-2 hover:bg-surface disabled:opacity-40";
const danger = "rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-500/20";

function moved<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const c = [...arr];
  [c[i], c[j]] = [c[j], c[i]];
  return c;
}

/** Lines in a text box become list items. Blank lines are dropped on save. */
const toLines = (items?: string[]) => (items ?? []).join("\n");

export default function DocsPageEditor() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [customised, setCustomised] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const load = async () => {
    const res = await fetch("/api/founder/docs-page");
    if (res.status === 403) return setForbidden(true);
    const d = await res.json();
    if (!res.ok) return setMsg({ ok: false, text: d.error || "Could not load the documentation." });
    setGroups(d.groups);
    setCustomised(d.customised);
    setUpdatedAt(d.updatedAt);
    setRevisions(d.revisions);
  };

  useEffect(() => { load(); }, []);

  if (forbidden) return <p className="text-xs text-muted">Only the founder can edit the public documentation.</p>;

  const setGroup = (gi: number, patch: Partial<Group>) =>
    setGroups((gs) => gs.map((g, i) => (i === gi ? { ...g, ...patch } : g)));
  const setSection = (gi: number, si: number, patch: Partial<Section>) =>
    setGroups((gs) => gs.map((g, i) => (i !== gi ? g : { ...g, sections: g.sections.map((s, j) => (j === si ? { ...s, ...patch } : s)) })));

  const addGroup = () => setGroups((gs) => [...gs, { title: "New group", sections: [] }]);
  const removeGroup = (gi: number) => {
    if (!window.confirm(`Remove the group "${groups[gi].title}" and all its sections?`)) return;
    setGroups((gs) => gs.filter((_, i) => i !== gi));
  };
  const addSection = (gi: number) =>
    setGroups((gs) => gs.map((g, i) => (i !== gi ? g : {
      ...g,
      sections: [...g.sections, { id: `new-section-${Date.now().toString(36)}`, title: "New section", body: ["Write the text here."] }],
    })));
  const removeSection = (gi: number, si: number) => {
    if (!window.confirm(`Remove the section "${groups[gi].sections[si].title}"?`)) return;
    setGroups((gs) => gs.map((g, i) => (i !== gi ? g : { ...g, sections: g.sections.filter((_, j) => j !== si) })));
  };

  const clean = (items?: string[]) => {
    const out = (items ?? []).map((x) => x.trim()).filter(Boolean);
    return out.length ? out : undefined;
  };

  const save = async () => {
    if (!window.confirm("Publish this documentation? It replaces the text on /docs straight away. Earlier versions are kept.")) return;
    setBusy(true);
    setMsg(null);
    const payload = groups.map((g) => ({
      title: g.title.trim(),
      sections: g.sections.map((s) => ({
        id: s.id.trim(),
        title: s.title.trim(),
        ...(s.intro?.trim() ? { intro: s.intro.trim() } : {}),
        ...(clean(s.steps) ? { steps: clean(s.steps) } : {}),
        ...(clean(s.body) ? { body: clean(s.body) } : {}),
        ...(clean(s.tips) ? { tips: clean(s.tips) } : {}),
      })),
    }));
    const res = await fetch("/api/founder/docs-page", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groups: payload }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: d.error || "Save failed." });
    setMsg({ ok: true, text: "Published. The documentation page is updated." });
    load();
  };

  const resetToBuiltIn = async () => {
    if (!window.confirm("Go back to the built-in documentation? The current version is kept in history.")) return;
    setBusy(true);
    const res = await fetch("/api/founder/docs-page", { method: "DELETE" });
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: "Reset failed." });
    setMsg({ ok: true, text: "Back to the built-in documentation." });
    load();
  };

  const loadRevision = (r: Revision) => {
    setGroups(r.groups);
    setMsg({ ok: true, text: `Loaded the version from ${new Date(r.createdAt).toLocaleString()}. Review it, then publish to make it live.` });
  };

  return (
    <section className={card}>
      <div>
        <h3 className="text-sm font-bold text-ink">Public documentation (/docs)</h3>
        <p className="text-xs text-muted mt-1">
          {customised ? `Saved version live${updatedAt ? `, last published ${new Date(updatedAt).toLocaleString()}` : ""}.` : "Showing the built-in text. Publishing replaces it."}
          {" "}Each section needs a unique ID (lowercase letters, numbers, hyphens). In the text boxes, one line is one item: steps, paragraphs, and tips each go on their own line.
        </p>
      </div>

      {groups.map((g, gi) => (
        <div key={gi} className="rounded-xl border border-line p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <input className={`${input} flex-1 min-w-[12rem] font-semibold`} value={g.title} onChange={(e) => setGroup(gi, { title: e.target.value })} placeholder="Group title" />
            <button className={small} disabled={gi === 0} onClick={() => setGroups((gs) => moved(gs, gi, -1))}>Up</button>
            <button className={small} disabled={gi === groups.length - 1} onClick={() => setGroups((gs) => moved(gs, gi, 1))}>Down</button>
            <button className={danger} onClick={() => removeGroup(gi)}>Remove group</button>
          </div>

          {g.sections.map((s, si) => (
            <div key={si} className="rounded-lg border border-line bg-sunk/40 p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <input className={`${input} flex-1 min-w-[10rem]`} value={s.title} onChange={(e) => setSection(gi, si, { title: e.target.value })} placeholder="Section title" />
                <input className={`${input} w-48 font-mono text-xs`} value={s.id} onChange={(e) => setSection(gi, si, { id: e.target.value.toLowerCase() })} placeholder="section-id" />
                <button className={small} disabled={si === 0} onClick={() => setGroups((gs) => gs.map((x, i) => (i !== gi ? x : { ...x, sections: moved(x.sections, si, -1) })))}>Up</button>
                <button className={small} disabled={si === g.sections.length - 1} onClick={() => setGroups((gs) => gs.map((x, i) => (i !== gi ? x : { ...x, sections: moved(x.sections, si, 1) })))}>Down</button>
                <button className={danger} onClick={() => removeSection(gi, si)}>Remove</button>
              </div>
              <textarea rows={2} className={input} value={s.intro ?? ""} onChange={(e) => setSection(gi, si, { intro: e.target.value })} placeholder="Intro (optional)" />
              <div className="grid gap-2 md:grid-cols-3">
                <div>
                  <p className="text-[11px] font-semibold text-muted mb-1">Steps (one per line)</p>
                  <textarea rows={5} className={area} value={toLines(s.steps)} onChange={(e) => setSection(gi, si, { steps: e.target.value.split("\n") })} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-muted mb-1">Paragraphs (one per line)</p>
                  <textarea rows={5} className={area} value={toLines(s.body)} onChange={(e) => setSection(gi, si, { body: e.target.value.split("\n") })} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-muted mb-1">Tips (one per line)</p>
                  <textarea rows={5} className={area} value={toLines(s.tips)} onChange={(e) => setSection(gi, si, { tips: e.target.value.split("\n") })} />
                </div>
              </div>
            </div>
          ))}

          <button className={small} onClick={() => addSection(gi)}>+ Add section</button>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <button className={small} onClick={addGroup}>+ Add group</button>
        <button onClick={save} disabled={busy || groups.length === 0} className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-40">
          {busy ? "Saving..." : "Publish documentation"}
        </button>
        <button onClick={resetToBuiltIn} disabled={busy || !customised} className={small}>Use built-in text</button>
      </div>
      {msg && <p className={`text-xs ${msg.ok ? "text-emerald-500" : "text-rose-500"}`}>{msg.text}</p>}

      {revisions.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-[11px] font-semibold text-muted">Earlier versions</p>
          {revisions.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
              <span className="text-xs text-ink-2">{new Date(r.createdAt).toLocaleString()}</span>
              <button className={small} onClick={() => loadRevision(r)}>Load into editor</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
