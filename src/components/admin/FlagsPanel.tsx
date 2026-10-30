"use client";

import { useEffect, useState } from "react";

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
    <section className="rounded-2xl border border-line bg-surface/[0.02] p-5 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-ink">Feature flags</h3>
        <p className="text-xs text-muted">Turn features on or off without a deploy.</p>
      </div>
      {message && <p className="text-xs text-moss">{message}</p>}
      <ul className="divide-y divide-line">
        {Object.keys(LABELS).map((key) => (
          <li key={key} className="flex items-center justify-between py-3">
            <span className="text-sm text-ink-2">{LABELS[key]}</span>
            <button onClick={() => toggle(key)} className={`rounded-full px-3 py-1 text-xs font-semibold ${flags[key] ? "bg-emerald-600 text-white" : "bg-sunk text-ink-2"}`}>
              {flags[key] ? "On" : "Off"}
            </button>
          </li>
        ))}
      </ul>
    </section>
    </div>
  );
}
