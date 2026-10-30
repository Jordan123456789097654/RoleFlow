"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/password-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        window.location.assign("/browse");
      } else {
        setError(data.error || "Invalid email or password.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap py-16 sm:py-20 max-w-2xl">
      <p className="eyebrow mb-3">Single Account Sign-In</p>
      <h1 className="display-md">Welcome back to RoleFlow</h1>
      <p className="mt-3 text-sm text-muted">
        Sign in once to access ApplyHub and all RoleFlow product portals with your unified account.
      </p>

      {error && (
        <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-400">
          {error}
        </div>
      )}

      {/* Discord Sign-In Options */}
      <div className="mt-8 space-y-4">
        <a
          href="/api/auth/login"
          className="glass-panel flex items-center justify-between rounded-2xl border border-line p-5 transition-colors hover:border-violet-500"
        >
          <div>
            <p className="text-base font-semibold text-ink">Continue with Discord</p>
            <p className="mt-1 text-xs text-muted">
              Fast, one-click sign in. Shares only your Discord ID and username with platform tools.
            </p>
          </div>
          <span className="shrink-0 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white">
            Discord Login &rarr;
          </span>
        </a>
      </div>

      {/* Divider */}
      <div className="relative my-8 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line" />
        </div>
        <span className="relative bg-paper px-3 text-xs uppercase font-mono text-muted">
          Or sign in with email &amp; password
        </span>
      </div>

      {/* Email / Password Form */}
      <form onSubmit={handlePasswordLogin} className="glass-panel rounded-2xl border border-line p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink mb-1">Email address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder-slate-400 focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-ink">Password</label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-violet-600 hover:text-violet-500 underline underline-offset-2"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder-slate-400 focus:border-violet-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-violet-600 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-violet-500 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In with Email"}
        </button>
      </form>
    </div>
  );
}
