"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";

/** Pages that stay reachable without a linked Roblox account: legal, sign-in, and appeals. */
const OPEN_PATHS = ["/terms", "/privacy", "/acceptable-use", "/community-guidelines", "/cookies", "/auth", "/appeal"];

/**
 * Blocks the whole site for signed-in accounts that have no Roblox account linked.
 * The page content is not rendered until the account is linked.
 */
export function RobloxLinkGate({ required, children }: { required: boolean; children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOpenPath = OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!required || isOpenPath) return <>{children}</>;

  async function link(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/user/settings/roblox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ robloxUsername: username }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not link that account.");
        return;
      }
      window.location.reload();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-16">
      <div className="w-full max-w-md">
        <p className="eyebrow mb-4">One step left</p>
        <h1 className="display-md">Link your Roblox account</h1>
        <p className="mt-4 text-[14px] leading-relaxed text-muted">
          ApplyHub by RoleFlow needs a Roblox account on every profile to verify applicants and staff. Enter your Roblox username
          below. This is required to keep using the site.
        </p>

        <form onSubmit={link} className="mt-8 space-y-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Roblox username"
            maxLength={40}
            autoFocus
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[15px] text-ink focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !username.trim()}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-[14px] font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {busy ? "Checking…" : "Link account"}
          </button>
          {error && <p className="text-[13px] text-red-700">{error}</p>}
        </form>

        <form method="post" action="/api/auth/logout" className="mt-6">
          <button type="submit" className="text-[13px] text-muted hover:text-ink">Sign out instead</button>
        </form>
      </div>
    </div>
  );
}
