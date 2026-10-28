"use client";

import { useEffect, useState } from "react";

type Template = {
  id: string;
  title: string;
  description: string | null;
  positionTitle: string;
  department: string | null;
  authorName: string;
  importCount: number;
  questionCount: number;
};
type Guild = { id: string; name: string };

export default function MarketplacePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [targetGuild, setTargetGuild] = useState("");
  const [shareGuild, setShareGuild] = useState("");
  const [sharePositions, setSharePositions] = useState<{ id: string; title: string }[]>([]);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTemplates = async () => {
    const res = await fetch("/api/marketplace/templates");
    if (res.ok) setTemplates(await res.json());
  };

  useEffect(() => {
    (async () => {
      await loadTemplates();
      const res = await fetch("/api/guilds/user");
      if (res.ok) {
        const data = await res.json();
        setGuilds(data.guilds || []);
        if (data.guilds?.[0]) {
          setTargetGuild(data.guilds[0].id);
          setShareGuild(data.guilds[0].id);
        }
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!shareGuild) return;
    (async () => {
      const res = await fetch(`/api/guilds/${shareGuild}/dashboard`);
      if (!res.ok) return setSharePositions([]);
      const data = await res.json();
      const src = data.guild ?? data;
      setSharePositions(src.positions ?? []);
    })();
  }, [shareGuild]);

  const notify = (ok: boolean, text: string) => setMessage({ ok, text });

  const importTemplate = async (id: string) => {
    if (!targetGuild) return notify(false, "Create or own a community first.");
    const res = await fetch(`/api/marketplace/templates/${id}/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guildId: targetGuild }),
    });
    const data = await res.json();
    notify(res.ok, res.ok ? "Imported as a new open position. Review it in the Form Builder." : data.error);
    if (res.ok) loadTemplates();
  };

  const shareToMarketplace = async (positionId: string, positionTitle: string) => {
    const res = await fetch("/api/marketplace/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guildId: shareGuild, positionId, title: positionTitle }),
    });
    const data = await res.json();
    notify(res.ok, res.ok ? `Shared "${positionTitle}" to the marketplace.` : data.error);
    if (res.ok) loadTemplates();
  };

  const card = "rounded-2xl border border-white/10 bg-white/[0.02] p-5";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="mb-1 text-2xl font-black text-white">Template Marketplace</h1>
      <p className="mb-6 text-sm text-slate-400">Import application forms other communities have shared, or share your own.</p>

      {message && (
        <div className={`mb-6 rounded-xl border p-3 text-sm ${message.ok ? "border-emerald-500/30 text-emerald-300" : "border-rose-500/30 text-rose-300"}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="space-y-3 lg:col-span-2">
          <h2 className="text-sm font-bold text-white">Shared templates</h2>
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-slate-500">No templates have been shared yet.</p>
          ) : (
            templates.map((t) => (
              <div key={t.id} className={`${card} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
                <div className="min-w-0">
                  <div className="font-semibold text-white">{t.title}</div>
                  <div className="text-xs text-slate-400">
                    {t.positionTitle}{t.department ? ` · ${t.department}` : ""} · {t.questionCount} questions · by {t.authorName}
                  </div>
                  {t.description && <p className="mt-1 text-xs text-slate-500">{t.description}</p>}
                  <div className="mt-1 text-[11px] text-slate-600">Imported {t.importCount}×</div>
                </div>
                <button
                  onClick={() => importTemplate(t.id)}
                  disabled={guilds.length === 0}
                  className="shrink-0 rounded-lg bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-40"
                >
                  Import
                </button>
              </div>
            ))
          )}
        </section>

        <aside className="space-y-6">
          {guilds.length === 0 ? (
            <div className={card}>
              <p className="text-sm text-slate-400">Sign in with Discord and own a community to import or share templates.</p>
            </div>
          ) : (
            <>
              <div className={`${card} space-y-2`}>
                <label className="text-xs font-semibold text-slate-300">Import into</label>
                <select value={targetGuild} onChange={(e) => setTargetGuild(e.target.value)} className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white">
                  {guilds.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className={`${card} space-y-3`}>
                <label className="text-xs font-semibold text-slate-300">Share a position from</label>
                <select value={shareGuild} onChange={(e) => setShareGuild(e.target.value)} className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white">
                  {guilds.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                {sharePositions.length === 0 ? (
                  <p className="text-xs text-slate-500">No positions in this community yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {sharePositions.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-white">{p.title}</span>
                        <button onClick={() => shareToMarketplace(p.id, p.title)} className="shrink-0 rounded-md bg-white/5 px-2.5 py-1 text-[11px] text-slate-200 hover:bg-white/10">
                          Share
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
