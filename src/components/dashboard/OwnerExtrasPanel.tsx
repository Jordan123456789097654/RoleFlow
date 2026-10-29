"use client";

import { useEffect, useState } from "react";

const field = "w-full rounded-lg border border-line bg-sunk px-3 py-2 text-sm text-ink outline-none focus:border-accent";

export default function OwnerExtrasPanel({ guildId }: { guildId: string }) {
  const [form, setForm] = useState({
    applicationsOpen: true,
    showApplicantCount: true,
    welcomeMessage: "",
    websiteUrl: "",
    discordInviteUrl: "",
    customBotAppId: "",
    customBotPublicKey: "",
    robloxMinAccountAgeDays: 0,
    robloxCloudApiKey: "",
    robloxAcceptRankId: "",
    robloxRequiredBadgeId: "",
  });
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/guilds/${guildId}/dashboard`).then((r) => r.json()).then((d) => {
      const g = d.guild ?? d;
      setHasApiKey(Boolean(g.hasRobloxCloudApiKey));
      setForm({
        applicationsOpen: g.applicationsOpen ?? true,
        showApplicantCount: g.showApplicantCount ?? true,
        welcomeMessage: g.welcomeMessage ?? "",
        websiteUrl: g.websiteUrl ?? "",
        discordInviteUrl: g.discordInviteUrl ?? "",
        customBotAppId: g.customBotAppId ?? "",
        customBotPublicKey: g.customBotPublicKey ?? "",
        robloxMinAccountAgeDays: g.robloxMinAccountAgeDays ?? 0,
        robloxCloudApiKey: "",
        robloxAcceptRankId: g.robloxAcceptRankId ?? "",
        robloxRequiredBadgeId: g.robloxRequiredBadgeId ?? "",
      });
      setLoaded(true);
    });
  }, [guildId]);

  const [registering, setRegistering] = useState(false);
  const [commandMsg, setCommandMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const registerCommandsNow = async () => {
    setRegistering(true);
    setCommandMsg(null);
    const res = await fetch(`/api/guilds/${guildId}/bot/commands`, { method: "POST" });
    const data = await res.json();
    setRegistering(false);
    setCommandMsg(res.ok ? { ok: true, text: `Registered ${data.count} commands for your bot. They can take up to an hour to appear in Discord.` } : { ok: false, text: data.error || "Registration failed." });
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const payload: any = {
      ...form,
      robloxMinAccountAgeDays: Number(form.robloxMinAccountAgeDays) || 0,
      robloxAcceptRankId: form.robloxAcceptRankId !== "" ? Number(form.robloxAcceptRankId) : null,
      robloxRequiredBadgeId: form.robloxRequiredBadgeId.trim() || null,
    };
    if (!form.robloxCloudApiKey.trim()) {
      delete payload.robloxCloudApiKey;
    }

    const res = await fetch(`/api/guilds/${guildId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      if (form.robloxCloudApiKey.trim()) {
        setHasApiKey(true);
        setForm((prev) => ({ ...prev, robloxCloudApiKey: "" }));
      }
      setMessage({ ok: true, text: "Saved." });
    } else {
      setMessage({ ok: false, text: data.error || "Could not save." });
    }
  };

  if (!loaded) return <p className="text-sm text-faint">Loading community settings...</p>;

  const toggle = (key: "applicationsOpen" | "showApplicantCount", label: string, hint: string) => (
    <label className="flex items-start justify-between gap-4 py-3">
      <span>
        <span className="block text-sm text-ink-2">{label}</span>
        <span className="block text-xs text-faint">{hint}</span>
      </span>
      <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="mt-1 h-4 w-4 shrink-0" />
    </label>
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-surface/[0.02] p-5">
        <h3 className="text-sm font-bold text-ink">Applications</h3>
        <div className="mt-2 divide-y divide-line">
          {toggle("applicationsOpen", "Accepting applications", "Turn off to stop new submissions across all positions. Existing applications are kept.")}
          {toggle("showApplicantCount", "Show applicant counts", "Display how many people applied to each opening on your community page.")}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface/[0.02] p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-ink">Community page</h3>
          <p className="text-xs text-faint">Shown on your public page above the openings.</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-2">Welcome message ({form.welcomeMessage.length}/500)</label>
          <textarea rows={4} maxLength={500} value={form.welcomeMessage} onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })} placeholder="What should applicants know before they apply?" className={field} />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-2">Website</label>
            <input value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://" className={field} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-2">Discord invite</label>
            <input value={form.discordInviteUrl} onChange={(e) => setForm({ ...form, discordInviteUrl: e.target.value })} placeholder="https://discord.gg/..." className={field} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface/[0.02] p-5 space-y-3">
        <div>
          <h3 className="text-sm font-bold text-ink">Roblox Open Cloud & Gating</h3>
          <p className="text-xs text-faint">Configure automated account age checks, badge ownership prerequisites, and automatic group ranking upon acceptance.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-2">Minimum Roblox Account Age (Days)</label>
            <input
              type="number"
              min={0}
              value={form.robloxMinAccountAgeDays}
              onChange={(e) => setForm({ ...form, robloxMinAccountAgeDays: Number(e.target.value) })}
              placeholder="0 (disabled)"
              className={field}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-2">Required Roblox Badge ID</label>
            <input
              value={form.robloxRequiredBadgeId}
              onChange={(e) => setForm({ ...form, robloxRequiredBadgeId: e.target.value })}
              placeholder="e.g. 2124849123"
              className={field}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-2">
              Auto-Accept Group Rank (1-255)
            </label>
            <input
              type="number"
              min={1}
              max={255}
              value={form.robloxAcceptRankId}
              onChange={(e) => setForm({ ...form, robloxAcceptRankId: e.target.value })}
              placeholder="Rank number in Roblox Group"
              className={field}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-2">
              Roblox Open Cloud API Key {hasApiKey && <span className="text-moss font-semibold">(Configured & Encrypted)</span>}
            </label>
            <input
              type="password"
              value={form.robloxCloudApiKey}
              onChange={(e) => setForm({ ...form, robloxCloudApiKey: e.target.value })}
              placeholder={hasApiKey ? "•••••••••••••••• (Leave blank to keep current key)" : "Enter Open Cloud API key"}
              className={field}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface/[0.02] p-5 space-y-3">
        <div>
          <h3 className="text-sm font-bold text-ink">Your own Discord bot</h3>
          <p className="text-xs text-faint">If you use a custom bot, set its interactions endpoint in the Discord Developer Portal to <span className="font-mono text-ink-2">https://roleflow.site/api/discord/interactions</span>, then paste its application ID and public key here so Quick Accept and Quick Reject work.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input value={form.customBotAppId} onChange={(e) => setForm({ ...form, customBotAppId: e.target.value })} placeholder="Application ID" className={field} />
          <input value={form.customBotPublicKey} onChange={(e) => setForm({ ...form, customBotPublicKey: e.target.value })} placeholder="Public key (64 hex characters)" className={field} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={registerCommandsNow} disabled={registering} className="rounded-lg bg-sunk px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sunk disabled:opacity-50">
            {registering ? "Registering..." : "Register commands on my bot"}
          </button>
          <span className="text-[11px] text-faint">Save your settings first. The token must belong to the application ID above.</span>
          {commandMsg && <span className={`text-xs ${commandMsg.ok ? "text-moss" : "text-danger"}`}>{commandMsg.text}</span>}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={save} disabled={saving} className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50">
          {saving ? "Saving..." : "Save community settings"}
        </button>
        {message && <span className={`text-xs ${message.ok ? "text-moss" : "text-danger"}`}>{message.text}</span>}
      </div>
    </div>
  );
}
