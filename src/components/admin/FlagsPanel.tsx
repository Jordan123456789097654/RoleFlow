"use client";

import { useEffect, useState } from "react";
import LicensingToggle from "./LicensingToggle";

const LABELS: Record<string, string> = {
  marketplace: "Template marketplace",
  roblox_linking: "Roblox account linking",
  community_reports: "Community and position reporting",
};

export default function FlagsPanel() {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/admin/flags").then((r) => r.json()).then(setFlags);
  }, []);

  const toggle = async (key: string) => {
    const next = { ...flags, [key]: !flags[key] };
    const res = await fetch("/api/admin/flags", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flags: { [key]: next[key] } }),
    });
    if (res.ok) {
      setFlags(await res.json());
      setMessage(`${LABELS[key] ?? key} ${next[key] ? "enabled" : "disabled"}. Takes effect immediately.`);
    } else {
      setMessage("Only the Founder can change feature flags.");
    }
  };

  return (
    <div className="space-y-6">
    <LicensingToggle />
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-white">Feature flags</h3>
        <p className="text-xs text-slate-400">Turn features on or off without a deploy.</p>
      </div>
      {message && <p className="text-xs text-emerald-300">{message}</p>}
      <ul className="divide-y divide-white/5">
        {Object.keys(LABELS).map((key) => (
          <li key={key} className="flex items-center justify-between py-3">
            <span className="text-sm text-slate-200">{LABELS[key]}</span>
            <button onClick={() => toggle(key)} className={`rounded-full px-3 py-1 text-xs font-semibold ${flags[key] ? "bg-emerald-600 text-white" : "bg-white/10 text-slate-300"}`}>
              {flags[key] ? "On" : "Off"}
            </button>
          </li>
        ))}
      </ul>
    </section>
    </div>
  );
}
