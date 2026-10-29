"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";

const OPEN_PATHS = ["/terms", "/privacy", "/acceptable-use", "/community-guidelines", "/cookies", "/auth", "/appeal"];

/** Site admins confirm a company email before using the site. */
export function AdminEmailGate({ required, children }: { required: boolean; children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOpenPath = OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!required || isOpenPath) return <>{children}</>;

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/company-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || "Could not send the code.");
    setSentTo(data.sentTo);
    setStep("code");
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/company-email", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || "Could not confirm the code.");
    window.location.reload();
  }

  const input = "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[15px] text-ink focus:border-accent focus:outline-none";
  const button = "w-full rounded-lg bg-accent px-4 py-2.5 text-[14px] font-medium text-white hover:bg-accent-hover disabled:opacity-50";

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-16">
      <div className="w-full max-w-md">
        <p className="eyebrow mb-4">Staff setup</p>
        <h1 className="display-md">Add your company email</h1>
        <p className="mt-4 text-[14px] leading-relaxed text-muted">
          Staff accounts (founders, admins, support, and moderators) must use a company email, so actions on RoleFlow
          can be traced to your organization. Personal addresses such as Gmail or Outlook are not accepted.
        </p>

        {step === "email" && (
          <form onSubmit={sendCode} className="mt-8 space-y-3">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourcompany.com" autoFocus className={input} />
            <button type="submit" disabled={busy || !email.trim()} className={button}>
              {busy ? "Sending…" : "Send confirmation code"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={confirm} className="mt-8 space-y-3">
            <p className="text-[13px] text-muted">
              We sent a 6-digit code to <span className="text-ink">{sentTo}</span>.
            </p>
            <input
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              autoFocus
              className={`${input} tracking-[0.4em]`}
            />
            <button type="submit" disabled={busy || code.length !== 6} className={button}>
              {busy ? "Checking…" : "Confirm email"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("email"); setCode(""); setError(null); }}
              className="text-[13px] text-muted hover:text-ink"
            >
              Use a different email
            </button>
          </form>
        )}

        {error && <p className="mt-3 text-[13px] text-red-700">{error}</p>}

        <form method="post" action="/api/auth/logout" className="mt-6">
          <button type="submit" className="text-[13px] text-muted hover:text-ink">Sign out instead</button>
        </form>
      </div>
    </div>
  );
}
