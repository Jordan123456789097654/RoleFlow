"use client";

import React, { useState, useEffect } from "react";

export function LoginMethodsManager() {
  const [loading, setLoading] = useState(true);
  const [methods, setMethods] = useState<{ hasDiscord: boolean; hasPassword: boolean; email?: string } | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchMethods = async () => {
    try {
      const res = await fetch("/api/auth/methods");
      if (res.ok) {
        const data = await res.json();
        setMethods(data);
        if (data.email) setEmailInput(data.email);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleAction = async (action: string, extraBody?: any) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extraBody }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ ok: true, text: data.message || "Updated successfully." });
        setShowPasswordForm(false);
        setPasswordInput("");
        fetchMethods();
      } else {
        setMessage({ ok: false, text: data.error || "Action failed." });
      }
    } catch {
      setMessage({ ok: false, text: "Network error. Please try again." });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="text-xs text-muted font-mono">Loading authentication credentials...</div>;
  }

  const hasDiscord = methods?.hasDiscord ?? false;
  const hasPassword = methods?.hasPassword ?? false;

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-xl border p-3.5 text-xs font-medium ${
            message.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-rose-500/30 bg-rose-500/10 text-rose-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Methods Status */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Discord Option */}
        <div className="rounded-2xl border border-line bg-surface/50 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="font-semibold text-sm text-ink">Discord</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  hasDiscord ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-500/20 text-zinc-400"
                }`}
              >
                {hasDiscord ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">
            Allows instant one-click sign in with your Discord user account.
          </p>
          <div className="mt-4">
            {hasDiscord ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  if (confirm("Are you sure you want to unlink Discord from this account?")) {
                    handleAction("unlink_discord");
                  }
                }}
                className="rounded-xl border border-line bg-paper px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
              >
                Unlink Discord
              </button>
            ) : (
              <a
                href="/api/auth/login"
                className="inline-block rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500"
              >
                Connect Discord
              </a>
            )}
          </div>
        </div>

        {/* Email / Password Option */}
        <div className="rounded-2xl border border-line bg-surface/50 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="font-semibold text-sm text-ink">Email &amp; Password</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  hasPassword ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-500/20 text-zinc-400"
                }`}
              >
                {hasPassword ? "Active" : "Not Set"}
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">
            Sign in using your email address and password across all RoleFlow products.
          </p>
          <div className="mt-4 flex gap-2">
            {hasPassword ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="rounded-xl border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface"
                >
                  Change Password
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => {
                    if (confirm("Are you sure you want to remove password login?")) {
                      handleAction("unlink_password");
                    }
                  }}
                  className="rounded-xl border border-line bg-paper px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
                >
                  Remove Password
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowPasswordForm(true)}
                className="rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500"
              >
                Set Up Password
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Password Link Form */}
      {showPasswordForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAction("link_password", { email: emailInput, password: passwordInput });
          }}
          className="rounded-2xl border border-line bg-surface/40 p-5 space-y-4 max-w-md"
        >
          <h4 className="text-sm font-bold text-ink">
            {hasPassword ? "Update Password" : "Set Up Email & Password Login"}
          </h4>
          <div>
            <label className="block text-xs font-medium text-ink mb-1">Email Address</label>
            <input
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink mb-1">New Password (min 8 characters)</label>
            <input
              type="password"
              required
              minLength={8}
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink focus:outline-none focus:border-violet-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={actionLoading}
              className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {actionLoading ? "Saving..." : "Save Credentials"}
            </button>
            <button
              type="button"
              onClick={() => setShowPasswordForm(false)}
              className="rounded-xl border border-line bg-paper px-4 py-2 text-xs font-medium text-ink hover:bg-surface"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
