"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, ArrowRight, Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="space-y-5">
        <AlertCircle className="h-8 w-8 text-danger" />
        <h1 className="display-md">This link isn&apos;t valid</h1>
        <p className="text-[15px] leading-relaxed text-muted">
          No password reset token was provided. Request a new reset link and try again.
        </p>
        <Link href="/auth/forgot-password" className="btn-primary">Request a new link</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to reset password.");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-5">
        <CheckCircle2 className="h-8 w-8 text-moss" />
        <h1 className="display-md">Password updated</h1>
        <p className="text-[15px] leading-relaxed text-muted">
          Your password has been changed. Taking you to your dashboard…
        </p>
        <Link href="/dashboard" className="btn-primary">
          Go to dashboard <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-3">Account</p>
        <h1 className="display-md">Choose a new password</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">At least 8 characters.</p>
      </div>

      {errorMsg && (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-danger bg-danger-soft px-4 py-3 text-[14px] text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="new-password" className="label">New password</label>
          <div className="relative">
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field h-11 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-sm text-muted hover:text-ink"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm-password" className="label">Confirm new password</label>
          <input
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            placeholder="Re-enter the password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="field h-11"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary btn-lg w-full">
          {loading ? "Updating password…" : "Update password and sign in"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="page-wrap flex min-h-[80vh] items-center justify-center py-16">
      <div className="card w-full max-w-md p-8 sm:p-10">
        <Suspense fallback={<p className="py-8 text-center text-[14px] text-muted">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
