"use client";

import React, { useMemo, useState } from "react";
import { PORTAL_LAYOUTS, HEADER_STYLES, MAX_HEADER_LINKS, MAX_FOOTER_LINKS, type SiteConfig, type SiteLink } from "@/lib/site-config";
import type { SiteData } from "@/lib/site-data";

type Props = { initial: SiteData };

type Draft = {
  portalAccentColor: string;
  portalLayout: string;
  announcement: string;
  welcomeMessage: string;
  description: string;
  websiteUrl: string;
  discordInviteUrl: string;
  icon: string;
  banner: string;
  showApplicantCount: boolean;
  siteConfig: SiteConfig;
};

const field = "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13px] text-ink focus:border-accent focus:outline-none";
const label = "text-[12px] font-semibold text-ink-2";
const hint = "text-[11px] text-faint";

export function SiteConfigForm({ initial }: Props) {
  const [draft, setDraft] = useState<Draft>({
    portalAccentColor: initial.portalAccentColor || "#e5532d",
    portalLayout: initial.portalLayout || "banner",
    announcement: initial.announcement ?? "",
    welcomeMessage: initial.welcomeMessage ?? "",
    description: initial.description ?? "",
    websiteUrl: initial.websiteUrl ?? "",
    discordInviteUrl: initial.discordInviteUrl ?? "",
    icon: initial.icon ?? "",
    banner: initial.banner ?? "",
    showApplicantCount: initial.showApplicantCount,
    siteConfig: initial.siteConfig,
  });
  const [saved, setSaved] = useState<SiteData>(initial);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(toDraft(saved)), [draft, saved]);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }
  function setSite<K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) {
    setDraft((d) => ({ ...d, siteConfig: { ...d.siteConfig, [key]: value } }));
  }

  async function save() {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/guilds/${initial.id}/site`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          // Empty optional URLs clear the field.
          websiteUrl: draft.websiteUrl.trim(),
          discordInviteUrl: draft.discordInviteUrl.trim(),
          icon: draft.icon.trim(),
          banner: draft.banner.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ tone: "err", text: data.error || "Could not save. Try again." });
        return;
      }
      setSaved(data.site);
      setNotice({ tone: "ok", text: "Saved. Your site is updated." });
    } catch {
      setNotice({ tone: "err", text: "Network error. Try again." });
    } finally {
      setBusy(false);
    }
  }

  const liveUrl = saved.customDomain && saved.customDomainVerified ? `https://${saved.customDomain}/` : null;
  const previewInitial = saved.name.charAt(0).toUpperCase();

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        {notice && (
          <div
            className={`rounded-xl border px-4 py-3 text-[13px] ${
              notice.tone === "ok" ? "border-emerald-500/40 text-emerald-300" : "border-red-500/40 text-red-300"
            }`}
          >
            {notice.text}
          </div>
        )}

        <section className="glass-panel rounded-2xl border border-line p-6 space-y-5">
          <h2 className="text-base font-bold text-ink">Look</h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={label}>Accent color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={draft.portalAccentColor}
                  onChange={(e) => set("portalAccentColor", e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-surface p-1"
                  aria-label="Accent color"
                />
                <input
                  type="text"
                  value={draft.portalAccentColor}
                  onChange={(e) => set("portalAccentColor", e.target.value)}
                  className={`${field} font-mono`}
                  maxLength={7}
                />
              </div>
              <p className={hint}>Used for buttons, the header bar, and highlights.</p>
            </div>

            <div className="space-y-1.5">
              <label className={label}>Button label</label>
              <input
                type="text"
                value={draft.siteConfig.buttonLabel}
                onChange={(e) => setSite("buttonLabel", e.target.value)}
                className={field}
                maxLength={30}
              />
              <p className={hint}>Shown in the header when a visitor isn&apos;t signed in.</p>
            </div>

            <div className="space-y-1.5">
              <label className={label}>Opening layout</label>
              <select value={draft.portalLayout} onChange={(e) => set("portalLayout", e.target.value)} className={field}>
                {PORTAL_LAYOUTS.map((l) => (
                  <option key={l} value={l}>
                    {l === "banner" ? "Banner (large header)" : l === "minimal" ? "Minimal (compact)" : "Cards"}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={label}>Header style</label>
              <select value={draft.siteConfig.headerStyle} onChange={(e) => setSite("headerStyle", e.target.value as SiteConfig["headerStyle"])} className={field}>
                {HEADER_STYLES.map((h) => (
                  <option key={h} value={h}>
                    {h === "banner" ? "Accent bar and logo" : "Plain"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Toggle label="Show header" checked={draft.siteConfig.showHeader} onChange={(v) => setSite("showHeader", v)} />
            <Toggle label="Show reviews" checked={draft.siteConfig.showReviews} onChange={(v) => setSite("showReviews", v)} />
            <Toggle label="Show applicant count" checked={draft.showApplicantCount} onChange={(v) => set("showApplicantCount", v)} />
          </div>
        </section>

        <section className="glass-panel rounded-2xl border border-line p-6 space-y-5">
          <h2 className="text-base font-bold text-ink">Copy</h2>
          <Area label="Announcement" hint="A short notice shown near the top. Up to 280 characters." value={draft.announcement} max={280} onChange={(v) => set("announcement", v)} />
          <Area label="Welcome message" hint="Shown above your openings. Up to 1,000 characters." value={draft.welcomeMessage} max={1000} onChange={(v) => set("welcomeMessage", v)} />
          <Area label="About your community" hint="Up to 1,000 characters." value={draft.description} max={1000} onChange={(v) => set("description", v)} />
        </section>

        <section className="glass-panel rounded-2xl border border-line p-6 space-y-5">
          <h2 className="text-base font-bold text-ink">Navigation</h2>
          <p className={hint}>Links shown in the header on larger screens. Up to {MAX_HEADER_LINKS}. Addresses must start with https://.</p>
          <LinkEditor value={draft.siteConfig.headerLinks} max={MAX_HEADER_LINKS} onChange={(v) => setSite("headerLinks", v)} />
        </section>

        <section className="glass-panel rounded-2xl border border-line p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-ink">Footer</h2>
            <Toggle label="Show footer" checked={draft.siteConfig.showFooter} onChange={(v) => setSite("showFooter", v)} />
          </div>
          <div className="space-y-1.5">
            <label className={label}>Footer text</label>
            <textarea rows={2} value={draft.siteConfig.footerNote} onChange={(e) => setSite("footerNote", e.target.value)} maxLength={160} className={field} placeholder="e.g. Questions? Email hello@yourstudio.com" />
            <p className={hint}>Up to 160 characters. Shown above the footer links.</p>
          </div>
          <div className="space-y-2">
            <label className={label}>Footer links</label>
            <p className={hint}>Up to {MAX_FOOTER_LINKS}. These appear in the footer, next to the text above.</p>
            <LinkEditor value={draft.siteConfig.footerLinks} max={MAX_FOOTER_LINKS} onChange={(v) => setSite("footerLinks", v)} />
          </div>
          <p className={hint}>&quot;Powered by RoleFlow&quot; always appears at the bottom of your site.</p>
        </section>

        <section className="glass-panel rounded-2xl border border-line p-6 space-y-5">
          <h2 className="text-base font-bold text-ink">Search and sharing</h2>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <label className={label}>Page title</label>
              <span className="font-mono text-[11px] text-faint">{draft.siteConfig.seoTitle.length}/70</span>
            </div>
            <input type="text" value={draft.siteConfig.seoTitle} onChange={(e) => setSite("seoTitle", e.target.value)} maxLength={70} className={field} placeholder={saved.name} />
            <p className={hint}>Shown in the browser tab and search results. Leave empty to use your community name.</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <label className={label}>Page description</label>
              <span className="font-mono text-[11px] text-faint">{draft.siteConfig.seoDescription.length}/200</span>
            </div>
            <textarea rows={2} value={draft.siteConfig.seoDescription} onChange={(e) => setSite("seoDescription", e.target.value)} maxLength={200} className={field} />
            <p className={hint}>Shown in search results and link previews. Leave empty to use your community description.</p>
          </div>
        </section>

        <section className="glass-panel rounded-2xl border border-line p-6 space-y-5">
          <h2 className="text-base font-bold text-ink">Links and images</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Url label="Logo image URL" value={draft.icon} onChange={(v) => set("icon", v)} />
            <Url label="Banner image URL" value={draft.banner} onChange={(v) => set("banner", v)} />
            <Url label="Website" value={draft.websiteUrl} onChange={(v) => set("websiteUrl", v)} />
            <Url label="Discord invite" value={draft.discordInviteUrl} onChange={(v) => set("discordInviteUrl", v)} />
          </div>
          <p className={hint}>Image and link addresses must start with https://. Leave a field empty to remove it.</p>
        </section>

        <div className="sticky bottom-4 flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface/95 p-4 backdrop-blur">
          <p className="text-[12px] text-muted">{dirty ? "You have unsaved changes." : "All changes saved."}</p>
          <button
            type="button"
            onClick={save}
            disabled={busy || !dirty}
            className="rounded-xl bg-accent px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div className="glass-panel rounded-2xl border border-line p-5 space-y-4">
          <h3 className="text-sm font-bold text-ink">Preview</h3>
          <div className="overflow-hidden rounded-xl border border-line bg-paper">
            {draft.siteConfig.showHeader && (
              <div>
                <div className="h-1" style={{ background: draft.portalAccentColor }} />
                <div className="flex items-center justify-between gap-2 px-3 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-surface">
                      {draft.icon ? <img src={draft.icon} alt="" className="h-full w-full object-cover" /> : <span className="text-sm font-semibold text-ink">{previewInitial}</span>}
                    </span>
                    <span className="truncate text-[13px] font-semibold text-ink">{saved.name}</span>
                  </div>
                  {draft.siteConfig.headerStyle === "banner" ? (
                    <span className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold text-white" style={{ background: draft.portalAccentColor }}>
                      {draft.siteConfig.buttonLabel || "Sign in"}
                    </span>
                  ) : (
                    <span className="shrink-0 text-[11px] font-semibold text-muted underline underline-offset-4">{draft.siteConfig.buttonLabel || "Sign in"}</span>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-2 px-3 py-4">
              {draft.announcement && <p className="rounded-md border border-line bg-surface px-2.5 py-2 text-[11px] text-ink-2">{draft.announcement}</p>}
              <p className="font-display text-base text-ink">{saved.name}</p>
              {draft.welcomeMessage && <p className="text-[11px] leading-relaxed text-ink-2 line-clamp-3">{draft.welcomeMessage}</p>}
              <div className="rounded-md border border-line px-2.5 py-2 text-[11px] text-muted">Open position</div>
            </div>
            {draft.siteConfig.showFooter && (
              <div className="space-y-1.5 border-t border-line px-3 py-3 text-[10px] text-muted">
                {draft.siteConfig.footerNote && <p>{draft.siteConfig.footerNote}</p>}
                {draft.siteConfig.footerLinks.length > 0 && (
                  <p className="flex flex-wrap gap-x-3 gap-y-1 underline underline-offset-2">
                    {draft.siteConfig.footerLinks.map((l) => <span key={l.url + l.label}>{l.label}</span>)}
                  </p>
                )}
                <p className="font-mono text-faint">Powered by RoleFlow</p>
              </div>
            )}
            {!draft.siteConfig.showFooter && (
              <div className="border-t border-line px-3 py-3 text-[10px] text-faint">
                <p className="font-mono">Powered by RoleFlow</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-line p-5 text-[12px] text-muted space-y-2">
          {liveUrl ? (
            <>
              <p>Your site is live at</p>
              <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="block break-all font-mono text-ink underline underline-offset-4">
                {liveUrl}
              </a>
            </>
          ) : (
            <p>
              Your site isn&apos;t live on its own domain yet. Connect one in <span className="text-ink">Settings → Custom Domain</span>, then your changes will show there.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

function toDraft(s: SiteData): Draft {
  return {
    portalAccentColor: s.portalAccentColor || "#e5532d",
    portalLayout: s.portalLayout || "banner",
    announcement: s.announcement ?? "",
    welcomeMessage: s.welcomeMessage ?? "",
    description: s.description ?? "",
    websiteUrl: s.websiteUrl ?? "",
    discordInviteUrl: s.discordInviteUrl ?? "",
    icon: s.icon ?? "",
    banner: s.banner ?? "",
    showApplicantCount: s.showApplicantCount,
    siteConfig: s.siteConfig,
  };
}

function Toggle({ label: text, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5">
      <span className="text-[13px] text-ink-2">{text}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
    </label>
  );
}

function Area({ label: text, hint: note, value, max, onChange }: { label: string; hint: string; value: string; max: number; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className={label}>{text}</label>
        <span className="font-mono text-[11px] text-faint">{value.length}/{max}</span>
      </div>
      <textarea rows={3} value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} className={field} />
      <p className={hint}>{note}</p>
    </div>
  );
}

function Url({ label: text, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className={label}>{text}</label>
      <input type="url" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://" className={`${field} font-mono`} />
    </div>
  );
}

function LinkEditor({ value, max, onChange }: { value: SiteLink[]; max: number; onChange: (v: SiteLink[]) => void }) {
  function update(i: number, patch: Partial<SiteLink>) {
    onChange(value.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  return (
    <div className="space-y-2">
      {value.map((l, i) => (
        <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
          <input type="text" value={l.label} maxLength={40} placeholder="Label" onChange={(e) => update(i, { label: e.target.value })} className={field} />
          <input type="url" value={l.url} placeholder="https://" onChange={(e) => update(i, { url: e.target.value })} className={`${field} font-mono`} />
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded-lg border border-line px-2 py-2 text-[12px] text-muted disabled:opacity-30" aria-label="Move up">↑</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="rounded-lg border border-line px-2 py-2 text-[12px] text-muted disabled:opacity-30" aria-label="Move down">↓</button>
            <button type="button" onClick={() => remove(i)} className="rounded-lg border border-line px-2.5 py-2 text-[12px] text-red-300 hover:text-red-200" aria-label="Remove link">Remove</button>
          </div>
        </div>
      ))}
      <button
        type="button"
        disabled={value.length >= max}
        onClick={() => onChange([...value, { label: "", url: "https://" }])}
        className="rounded-xl border border-dashed border-line-strong px-4 py-2 text-[12px] font-semibold text-ink-2 disabled:opacity-40"
      >
        + Add link
      </button>
    </div>
  );
}
