"use client";

import React, { useState } from "react";

export function ParentNotifyForm({ interest, isNewsletter }: { interest?: string; isNewsletter?: boolean }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/parent/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: isNewsletter ? "newsletter" : "notify",
          email,
          interest: interest || "general",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ ok: true, text: data.message || "Thank you! You're on the list." });
        setEmail("");
      } else {
        setMessage({ ok: false, text: data.error || "Failed to submit. Please try again." });
      }
    } catch {
      setMessage({ ok: false, text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-2">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-violet-500 disabled:opacity-50"
        >
          {loading ? "..." : isNewsletter ? "Subscribe" : "Notify Me"}
        </button>
      </div>
      {message && (
        <p className={`text-[11px] font-medium ${message.ok ? "text-emerald-400" : "text-rose-400"}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}

export function ParentContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/parent/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "contact",
          name,
          email,
          message,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus({ ok: true, text: data.message || "Message sent successfully!" });
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setStatus({ ok: false, text: data.error || "Failed to send message." });
      }
    } catch {
      setStatus({ ok: false, text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400">Your Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alex Carter"
          className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400">Email Address *</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="alex@example.com"
          className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400">Message *</label>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can the RoleFlow team help your community?"
          className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-violet-500 disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send Message to RoleFlow"}
      </button>

      {status && (
        <p className={`text-center text-xs font-medium ${status.ok ? "text-emerald-400" : "text-rose-400"}`}>
          {status.text}
        </p>
      )}
    </form>
  );
}

export function ParentIdeaForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/parent/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "idea",
          email,
          message,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus({ ok: true, text: data.message || "Thank you! Your idea has been logged for our product roadmap." });
        setEmail("");
        setMessage("");
      } else {
        setStatus({ ok: false, text: data.error || "Failed to submit idea." });
      }
    } catch {
      setStatus({ ok: false, text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400">Your Email *</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-400">What tool or feature should we build next? *</label>
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe what problem you want solved for your community..."
          className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-violet-500 disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Product Suggestion"}
      </button>

      {status && (
        <p className={`text-center text-xs font-medium ${status.ok ? "text-emerald-400" : "text-rose-400"}`}>
          {status.text}
        </p>
      )}
    </form>
  );
}
