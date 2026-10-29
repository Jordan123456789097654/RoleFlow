"use client";

import { useEffect, useState } from "react";

type DomainStatus = {
  domain: string | null;
  verified: boolean;
  verifiedAt: string | null;
  dns: {
    verification: { type: string; host: string; value: string };
    routing: { type: string; host: string; value: string };
  } | null;
  available: boolean;
  routingReady?: boolean;
};

export default function CustomDomainPanel({ guildId }: { guildId: string }) {
  const base = `/api/guilds/${guildId}/domain`;
  const [status, setStatus] = useState<DomainStatus | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "err" | "warn"; text: string } | null>(null);

  async function load() {
    const res = await fetch(base, { cache: "no-store" });
    if (res.ok) setStatus(await res.json());
  }

  useEffect(() => {
    load();
  }, [guildId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(method: "POST" | "DELETE", path = "", body?: unknown) {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(base + path, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ tone: "err", text: data.error || "Something went wrong." });
        return;
      }
      if (data.warning) setNotice({ tone: "warn", text: data.warning });
      else if (data.message) setNotice({ tone: data.verified === false ? "warn" : "ok", text: data.message });
      if (method === "POST" && !path) setInput("");
      await load();
    } catch {
      setNotice({ tone: "err", text: "Network error. Try again." });
    } finally {
      setBusy(false);
    }
  }

  const toneClass = {
    ok: "border-emerald-500/40 text-emerald-300",
    warn: "border-amber-500/40 text-amber-300",
    err: "border-red-500/40 text-red-300",
  } as const;

  return (
    <div className="glass-panel rounded-2xl border border-line p-6 sm:p-8 space-y-4">
      <h2 className="text-base font-bold text-ink mb-1">Custom Domain</h2>
      <p className="text-xs text-muted">
        Run your community from your own address, like <span className="font-mono">apply.yourstudio.com</span>.
        The portal, applications, and your dashboard all work there. Sign-in is handled through roleflow.site.
      </p>

      {notice && (
        <div className={`rounded-xl border px-4 py-3 text-xs ${toneClass[notice.tone]}`}>{notice.text}</div>
      )}

      {!status?.domain ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="apply.yourstudio.com"
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface border border-line text-xs text-ink font-mono focus:outline-none focus:border-accent"
          />
          <button
            type="button"
            disabled={busy || !input.trim()}
            onClick={() => run("POST", "", { domain: input })}
            className="px-4 py-2.5 rounded-xl bg-accent text-white text-xs font-semibold disabled:opacity-50"
          >
            {busy ? "Connecting…" : "Connect domain"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-mono text-sm text-ink">{status.domain}</p>
              <p className={`text-xs ${status.verified ? "text-emerald-300" : "text-amber-300"}`}>
                {status.verified ? "Ownership verified" : "Waiting for DNS verification"}
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => run("DELETE")}
              className="text-xs text-red-300 hover:text-red-200 disabled:opacity-50"
            >
              Remove domain
            </button>
          </div>

          {status.dns && (
            <div className="space-y-3 text-xs">
              <div className="rounded-xl bg-surface border border-line p-4">
                <p className="font-semibold text-ink-2 mb-2">1. Prove you own it (TXT record)</p>
                <p className="text-muted">Type: <span className="font-mono">TXT</span></p>
                <p className="text-muted">Host: <span className="font-mono break-all">{status.dns.verification.host}</span></p>
                <p className="text-muted">Value: <span className="font-mono break-all">{status.dns.verification.value}</span></p>
              </div>
              <div className="rounded-xl bg-surface border border-line p-4">
                <p className="font-semibold text-ink-2 mb-2">2. Point the domain to RoleFlow</p>
                <p className="text-muted">Type: <span className="font-mono">{status.dns.routing.type}</span></p>
                <p className="text-muted">Host: <span className="font-mono">{status.dns.routing.host}</span></p>
                <p className="text-muted">Value: <span className="font-mono">{status.dns.routing.value}</span></p>
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={() => run("POST", "/verify")}
            className="px-4 py-2.5 rounded-xl bg-accent text-white text-xs font-semibold disabled:opacity-50"
          >
            {busy ? "Checking…" : status.verified ? "Recheck" : "Check verification"}
          </button>
        </div>
      )}

      {!status?.available && (
        <p className="text-[11px] text-muted">
          Automatic HTTPS for custom domains isn&apos;t configured on this server yet.
        </p>
      )}
    </div>
  );
}
