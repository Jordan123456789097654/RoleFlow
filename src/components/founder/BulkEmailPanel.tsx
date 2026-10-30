"use client";

import React, { useEffect, useMemo, useState } from "react";
import { TEMPLATES, renderEmail, type Template } from "@/lib/email-templates";

type Meta = {
  categories: string[];
  templates: { id: string; name: string; category: string; description: string; fields: Template["fields"] }[];
  audience: number;
  batchLimit: number;
  campaigns: { id: string; name: string; templateId: string; status: string; totalSent: number; totalFailed: number; createdAt: string }[];
};

const input = "w-full px-3 py-2 rounded-xl bg-surface border border-line text-xs text-ink focus:outline-none focus:border-accent";
const btn = "px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold disabled:opacity-40";
const ghost = "px-4 py-2 rounded-xl bg-surface text-ink-2 border border-line text-xs font-semibold disabled:opacity-40";

const clientTemplates = TEMPLATES; // same module the server uses, so previews match sends

export default function BulkEmailPanel() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [category, setCategory] = useState<string>("All");
  const [tplId, setTplId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [campaignName, setCampaignName] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const tpl = useMemo(() => clientTemplates.find((t) => t.id === tplId) ?? null, [tplId]);

  async function load() {
    const res = await fetch("/api/founder/bulk-email");
    if (res.ok) setMeta(await res.json());
  }
  useEffect(() => { load(); }, []);

  function pick(t: Template) {
    setTplId(t.id);
    setValues(Object.fromEntries(t.fields.map((f) => [f.key, f.default])));
    setCampaignName(`${t.name} · ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`);
    setDraftId(null);
    setConfirmText("");
    setMsg(null);
  }

  // Live preview, rendered with the same code the server uses.
  const preview = useMemo(() => {
    if (!tpl) return null;
    try {
      return { ok: true as const, ...renderEmail(tpl, values, "Alex") };
    } catch (e: any) {
      return { ok: false as const, error: e?.message ?? "This content is not valid yet." };
    }
  }, [tpl, values]);

  async function post(body: Record<string, unknown>) {
    const res = await fetch("/api/founder/bulk-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed.");
    return data;
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  }

  const sendTest = () => run(async () => {
    await post({ action: "test", templateId: tplId, values });
    setMsg({ ok: true, text: "Test sent to your account email. Check your inbox." });
  });

  const createDraft = () => run(async () => {
    const data = await post({ action: "create", name: campaignName, templateId: tplId, values });
    setDraftId(data.campaign.id);
    setConfirmText("");
    await load();
    setMsg({ ok: true, text: `Draft saved. It will reach up to ${meta?.audience ?? "?"} accounts. Nothing has been sent yet.` });
  });

  const sendBatch = () => run(async () => {
    if (!draftId) return;
    const data = await post({ action: "send", campaignId: draftId, confirm: confirmText });
    setConfirmText("");
    await load();
    setMsg({
      ok: data.failed === 0,
      text: data.remaining > 0
        ? `Sent ${data.sent} this batch${data.failed ? `, ${data.failed} failed` : ""}. ${data.remaining} still to send. Type SEND again to continue.`
        : `Done. ${data.totalSent} sent in total${data.totalFailed ? `, ${data.totalFailed} failed` : ""}. Nothing left to send.`,
    });
  });

  const discard = (id: string) => run(async () => {
    if (!window.confirm("Discard this draft? It has not sent anything.")) return;
    await post({ action: "discard", campaignId: id });
    if (draftId === id) setDraftId(null);
    await load();
  });

  const activeCampaign = meta?.campaigns.find((c) => c.id === draftId) ?? null;
  const visible = clientTemplates.filter((t) => category === "All" || t.category === category);

  return (
    <section className="glass-panel p-5 rounded-2xl space-y-6">
      <div>
        <h2 className="text-sm font-bold text-ink">Bulk email</h2>
        <p className="text-[12px] text-muted mt-1 max-w-3xl">
          Pick a template, fill in the details, and check the preview. Test it to yourself first.
          Sends go to account addresses (where email notifications are on) and verified company addresses. Banned accounts and anyone who has unsubscribed are skipped. Every email has a working unsubscribe link and one-click header.
          Each campaign sends in batches of up to {meta?.batchLimit ?? 500}, and each address gets it once.
        </p>
        <p className="text-[12px] text-ink-2 mt-2">
          Eligible addresses right now (before de-duplication): <span className="font-semibold">{meta?.audience ?? "-"}</span>
        </p>
      </div>

      {/* 1. Template gallery */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {["All", ...(meta?.categories ?? [])].map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border ${category === c ? "bg-accent text-white border-accent" : "bg-surface text-ink-2 border-line"}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((t) => (
            <button
              key={t.id}
              onClick={() => pick(t)}
              className={`text-left p-4 rounded-xl border transition-colors ${tplId === t.id ? "border-accent bg-sunk" : "border-line bg-surface hover:border-accent"}`}
            >
              <p className="text-[11px] uppercase tracking-wide text-muted">{t.category}</p>
              <p className="text-sm font-semibold text-ink mt-1">{t.name}</p>
              <p className="text-[12px] text-muted mt-1">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {tpl && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 2. Fields */}
          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Content: {tpl.name}</p>
            {tpl.fields.map((f) => (
              <div key={f.key}>
                <label className="text-[11px] font-semibold text-muted">{f.label}{f.required ? " *" : ""}</label>
                {f.multiline ? (
                  <textarea rows={5} className={input} value={values[f.key] ?? ""} onChange={(e) => { setValues({ ...values, [f.key]: e.target.value }); setDraftId(null); }} />
                ) : (
                  <input className={input} value={values[f.key] ?? ""} onChange={(e) => { setValues({ ...values, [f.key]: e.target.value }); setDraftId(null); }} />
                )}
                {f.help && <p className="text-[11px] text-muted mt-1">{f.help}</p>}
              </div>
            ))}
            <div>
              <label className="text-[11px] font-semibold text-muted">Campaign name (internal)</label>
              <input className={input} value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
            </div>
          </div>

          {/* 3. Preview */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Preview</p>
            {preview && preview.ok ? (
              <>
                <p className="text-[12px] text-ink-2">Subject: <span className="font-semibold">{preview.subject}</span></p>
                <iframe title="Email preview" sandbox="" srcDoc={preview.html} className="w-full h-[520px] rounded-xl border border-line bg-white" />
              </>
            ) : (
              <p className="text-xs text-danger">{preview && !preview.ok ? preview.error : ""}</p>
            )}
          </div>
        </div>
      )}

      {tpl && (
        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <button className={ghost} disabled={busy || !preview?.ok} onClick={sendTest}>Send test to me</button>
          <button className={btn} disabled={busy || !preview?.ok || !campaignName.trim()} onClick={createDraft}>Save as draft campaign</button>
        </div>
      )}

      {/* 4. Campaign send */}
      {activeCampaign && (
        <div className="p-4 rounded-xl bg-sunk space-y-3">
          <p className="text-[12px] text-ink-2">
            <span className="font-semibold">{activeCampaign.name}</span> · status {activeCampaign.status} · sent {activeCampaign.totalSent} · failed {activeCampaign.totalFailed}
          </p>
          {activeCampaign.status !== "COMPLETE" && (
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-[11px] font-semibold text-muted">Type SEND to confirm</label>
                <input className={input} value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="SEND" />
              </div>
              <button className={btn} disabled={busy || confirmText !== "SEND"} onClick={sendBatch}>
                {busy ? "Sending..." : `Send next batch (up to ${meta?.batchLimit ?? 500})`}
              </button>
            </div>
          )}
        </div>
      )}

      {msg && <p className={`text-xs ${msg.ok ? "text-emerald-500" : "text-danger"}`}>{msg.text}</p>}

      {/* 5. History */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Recent campaigns</p>
        {meta && meta.campaigns.length === 0 && <p className="text-xs text-muted">No campaigns yet.</p>}
        {meta?.campaigns.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-line text-[12px]">
            <div>
              <p className="font-semibold text-ink">{c.name}</p>
              <p className="text-muted">{new Date(c.createdAt).toLocaleString()} · {c.status} · sent {c.totalSent}{c.totalFailed ? ` · failed ${c.totalFailed}` : ""}</p>
            </div>
            <div className="flex gap-2">
              <button className={ghost} onClick={() => setDraftId(c.id)}>Open</button>
              {c.status === "DRAFT" && c.totalSent === 0 && <button className={ghost} disabled={busy} onClick={() => discard(c.id)}>Discard</button>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
