"use client";

import { useEffect, useState } from "react";

const field = "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-purple-500";

export default function OwnerExtrasPanel({ guildId }: { guildId: string }) {
  const [form, setForm] = useState({
    applicationsOpen: true,
    showApplicantCount: true,
    welcomeMessage: "",
    websiteUrl: "",
    discordInviteUrl: "",
    customBotAppId: "",
    customBotPublicKey: "",
  });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/guilds/${guildId}/dashboard`).then((r) => r.json()).then((d) => {
      const g = d.guild ?? d;
      setForm({
        applicationsOpen: g.applicationsOpen ?? true,
        showApplicantCount: g.showApplicantCount ?? true,
        welcomeMessage: g.welcomeMessage ?? "",
        websiteUrl: g.websiteUrl ?? "",
        discordInviteUrl: g.discordInviteUrl ?? "",
        customBotAppId: g.customBotAppId ?? "",
        customBotPublicKey: g.customBotPublicKey ?? "",
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
    const res = await fetch(`/api/guilds/${guildId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    setMessage(res.ok ? { ok: true, text: "Saved." } : { ok: false, text: data.error || "Could not save." });
  };

  if (!loaded) return <p className="text-sm text-slate-500">Loading community settings...</p>;

  const toggle = (key: "applicationsOpen" | "showApplicantCount", label: string, hint: string) => (
    <label className="flex items-start justify-between gap-4 py-3">
      <span>
        <span className="block text-sm text-slate-200">{label}</span>
        <span className="block text-xs text-slate-500">{hint}</span>
      </span>
      <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="mt-1 h-4 w-4 shrink-0" />
    </label>
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h3 className="text-sm font-bold text-white">Applications</h3>
        <div className="mt-2 divide-y divide-white/5">
          {toggle("applicationsOpen", "Accepting applications", "Turn off to stop new submissions across all positions. Existing applications are kept.")}
          {toggle("showApplicantCount", "Show applicant counts", "Display how many people applied to each opening on your community page.")}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white">Community page</h3>
          <p className="text-xs text-slate-500">Shown on your public page above the openings.</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Welcome message ({form.welcomeMessage.length}/500)</label>
          <textarea rows={4} maxLength={500} value={form.welcomeMessage} onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })} placeholder="What should applicants know before they apply?" className={field} />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Website</label>
            <input value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://" className={field} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Discord invite</label>
            <input value={form.discordInviteUrl} onChange={(e) => setForm({ ...form, discordInviteUrl: e.target.value })} placeholder="https://discord.gg/..." className={field} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
        <div>
          <h3 className="text-sm font-bold text-white">Your own Discord bot</h3>
          <p className="text-xs text-slate-500">If you use a custom bot, set its interactions endpoint in the Discord Developer Portal to <span className="font-mono text-slate-300">https://roleflow.site/api/discord/interactions</span>, then paste its application ID and public key here so Quick Accept and Quick Reject work.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input value={form.customBotAppId} onChange={(e) => setForm({ ...form, customBotAppId: e.target.value })} placeholder="Application ID" className={field} />
          <input value={form.customBotPublicKey} onChange={(e) => setForm({ ...form, customBotPublicKey: e.target.value })} placeholder="Public key (64 hex characters)" className={field} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={registerCommandsNow} disabled={registering} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-50">
            {registering ? "Registering..." : "Register commands on my bot"}
          </button>
          <span className="text-[11px] text-slate-500">Save your settings first. The token must belong to the application ID above.</span>
          {commandMsg && <span className={`text-xs ${commandMsg.ok ? "text-emerald-300" : "text-rose-400"}`}>{commandMsg.text}</span>}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={save} disabled={saving} className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50">
          {saving ? "Saving..." : "Save community settings"}
        </button>
        {message && <span className={`text-xs ${message.ok ? "text-emerald-300" : "text-rose-400"}`}>{message.text}</span>}
      </div>
    </div>
  );
}
