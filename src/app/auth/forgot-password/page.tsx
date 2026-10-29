"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to send reset link.");
      } else {
        setSuccess(true);
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap flex min-h-[80vh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>

        <div className="card mt-6 p-8 sm:p-10">
          {success ? (
            <div className="space-y-5">
              <CheckCircle2 className="h-8 w-8 text-moss" />
              <h1 className="display-md">Check your inbox</h1>
              <p className="text-[15px] leading-relaxed text-ink-2">
                If an account matches <strong className="font-medium text-ink">{email}</strong>, we have sent a secure password reset link.
              </p>
              <p className="rounded-md bg-sunk px-4 py-3 text-[13px] text-muted">
                The link is valid for one hour. If you don&apos;t see it within a few minutes, check your spam or promotions folder.
              </p>
              <Link href="/dashboard" className="btn-primary">Return to dashboard</Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="eyebrow mb-3">Account</p>
                <h1 className="display-md">Reset your password</h1>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">
                  Enter the email address on your account and we&apos;ll send you a reset link.
                </p>
              </div>

              <p className="rounded-md border border-line bg-sunk px-4 py-3 text-[13px] leading-relaxed text-ink-2">
                <span className="font-medium text-ink">Security:</span> RoleFlow staff will never ask for your password. If you sign in with Discord, keep using Discord to sign in.
              </p>

              {errorMsg && (
                <div role="alert" className="flex items-center gap-2 rounded-md border border-danger bg-danger-soft px-4 py-3 text-[14px] text-danger">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reset-email" className="label">Account email</label>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field h-11"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary btn-lg w-full">
                  {loading ? "Sending reset email…" : "Send reset email"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
