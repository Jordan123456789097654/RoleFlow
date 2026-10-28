"use client";

import { useEffect, useState } from "react";

type Phase = "loading" | "setup" | "enter" | "recovery_codes" | "expired" | "done";

export default function TwoFactorPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [secret, setSecret] = useState("");
  const [otpUrl, setOtpUrl] = useState("");
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [codes, setCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const status = await fetch("/api/auth/2fa/status");
      if (!status.ok) {
        setPhase("expired");
        return;
      }
      const data = await status.json();
      if (data.enabled) {
        setPhase("enter");
        return;
      }
      const setup = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const sd = await setup.json();
      if (!setup.ok) {
        setError(sd.error);
        setPhase("expired");
        return;
      }
      setSecret(sd.secret);
      setOtpUrl(sd.otpauthUrl);
      setPhase("setup");
    })();
  }, []);

  const post = async (url: string, body: unknown) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return null;
      }
      return data;
    } finally {
      setBusy(false);
    }
  };

  const onEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await post("/api/auth/2fa/enable", { code });
    if (data) {
      setCodes(data.recoveryCodes);
      setPhase("recovery_codes");
    }
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await post("/api/auth/2fa/verify", useRecovery ? { recoveryCode: recovery } : { code });
    if (data) window.location.href = data.redirect || "/";
  };

  const card = "w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8";
  const input =
    "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-center text-lg tracking-widest text-white outline-none focus:border-purple-500";
  const button =
    "w-full rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-500 disabled:opacity-50";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08090d] p-6 text-slate-200">
      <div className={card}>
        {phase === "loading" && <p className="text-slate-400">Loading...</p>}

        {phase === "expired" && (
          <>
            <h1 className="mb-2 text-xl font-bold text-white">Sign-in expired</h1>
            <p className="mb-6 text-sm text-slate-400">{error || "Your verification window closed. Please sign in again."}</p>
            <a href="/" className={`${button} block text-center`}>Back to RoleFlow</a>
          </>
        )}

        {phase === "setup" && (
          <form onSubmit={onEnable} className="space-y-4">
            <h1 className="text-xl font-bold text-white">Set up two-factor authentication</h1>
            <p className="text-sm text-slate-400">
              Site admin accounts require 2FA. Add this key to an authenticator app (Google Authenticator, 1Password, Authy),
              then enter the 6-digit code it shows.
            </p>
            <div className="break-all rounded-lg bg-black/40 p-3 font-mono text-sm text-purple-300">{secret}</div>
            <p className="break-all text-xs text-slate-500">Or open: {otpUrl}</p>
            <input
              className={input}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <button className={button} disabled={busy || code.length < 6}>Turn on 2FA</button>
          </form>
        )}

        {phase === "enter" && (
          <form onSubmit={onVerify} className="space-y-4">
            <h1 className="text-xl font-bold text-white">Two-factor verification</h1>
            <p className="text-sm text-slate-400">
              {useRecovery ? "Enter one of your recovery codes." : "Enter the 6-digit code from your authenticator app."}
            </p>
            {useRecovery ? (
              <input className={input} value={recovery} onChange={(e) => setRecovery(e.target.value)} required />
            ) : (
              <input
                className={input}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            )}
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <button className={button} disabled={busy}>Verify</button>
            <button type="button" className="w-full text-sm text-slate-400 hover:text-white" onClick={() => setUseRecovery(!useRecovery)}>
              {useRecovery ? "Use an authenticator code instead" : "Use a recovery code instead"}
            </button>
          </form>
        )}

        {phase === "recovery_codes" && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-white">Save your recovery codes</h1>
            <p className="text-sm text-slate-400">Each code works once. They are shown only now.</p>
            <ul className="grid grid-cols-2 gap-2 rounded-lg bg-black/40 p-4 font-mono text-sm text-purple-300">
              {codes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <a href="/" className={`${button} block text-center`}>I've saved them, continue</a>
          </div>
        )}
      </div>
    </main>
  );
}
