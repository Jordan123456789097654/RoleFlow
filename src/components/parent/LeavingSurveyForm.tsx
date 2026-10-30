"use client";

import React, { useState } from "react";
import { DEPARTURE_REASONS } from "@/lib/departure-survey";

export function LeavingSurveyForm({ surveyId }: { surveyId: string }) {
  const [reason, setReason] = useState<string>("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      setError("Choose a reason first.");
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/departure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: surveyId, reason, comment }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <p className="text-lg font-bold text-white">Thank you. We read every answer.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="mb-3 text-sm font-semibold text-white">Pick the closest reason</legend>
        {DEPARTURE_REASONS.map((r) => (
          <label
            key={r.value}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
              reason === r.value
                ? "border-violet-500 bg-violet-500/10 text-white"
                : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20"
            }`}
          >
            <input
              type="radio"
              name="reason"
              value={r.value}
              checked={reason === r.value}
              onChange={() => setReason(r.value)}
              className="h-4 w-4 accent-violet-500"
            />
            {r.label}
          </label>
        ))}
      </fieldset>

      <div>
        <label htmlFor="leaving-comment" className="mb-2 block text-sm font-semibold text-white">
          Anything else you want us to know? <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="leaving-comment"
          value={comment}
          maxLength={1000}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-white/15 bg-white/[0.05] p-3 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-rose-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-violet-500 disabled:opacity-50"
      >
        {status === "sending" ? "Sending..." : "Send my answer"}
      </button>
    </form>
  );
}
