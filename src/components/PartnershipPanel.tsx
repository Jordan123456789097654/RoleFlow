"use client";

import { useEffect, useState } from "react";

type Application = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  message: string;
  website: string | null;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

const STATUS_LABEL = {
  PENDING: { text: "Under review", tone: "text-amber-300" },
  APPROVED: { text: "Approved", tone: "text-emerald-300" },
  REJECTED: { text: "Not approved", tone: "text-red-300" },
} as const;

export default function PartnershipPanel({ guildId }: { guildId: string }) {
  const base = `/api/guilds/${guildId}/partnership`;
  const [isPartner, setIsPartner] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function load() {
    const res = await fetch(base, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setIsPartner(data.isPartner);
      setApplication(data.application);
    }
  }

  useEffect(() => {
    load();
  }, [guildId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit() {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ tone: "err", text: data.error || "Something went wrong." });
        return;
      }
      setNotice({ tone: "ok", text: data.message });
      setMessage("");
      setWebsite("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = !busy && message.trim().length >= 80 && application?.status !== "PENDING" && !isPartner;

  return (
    <div className="card space-y-4 p-6 sm:p-8">
      <div>
        <h2 className="display-md">Partnership</h2>
        <p className="mt-1 text-[14px] text-ink-2">
          Partners get the Partner badge and can be featured on RoleFlow. Ask for a partnership here, and the RoleFlow founder reviews each request.
        </p>
      </div>

      {notice && (
        <div
          className={`rounded-xl border px-4 py-3 text-[13px] ${
            notice.tone === "ok" ? "border-emerald-500/40 text-emerald-300" : "border-red-500/40 text-red-300"
          }`}
        >
          {notice.text}
        </div>
      )}

      {isPartner ? (
        <p className="text-[14px] font-semibold text-emerald-300">This community is a RoleFlow partner.</p>
      ) : application ? (
        <div className="space-y-2 rounded-xl border border-line bg-surface p-4">
          <p className="text-[13px] text-ink-2">
            Latest request, sent {new Date(application.createdAt).toLocaleDateString()}:{" "}
            <span className={`font-semibold ${STATUS_LABEL[application.status].tone}`}>
              {STATUS_LABEL[application.status].text}
            </span>
          </p>
          {application.reviewNote && <p className="text-[13px] text-ink-2">Founder note: {application.reviewNote}</p>}
        </div>
      ) : null}

      {!isPartner && application?.status !== "PENDING" && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-ink-2">Tell us about your community</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder="What your community is, how active it is, and why it should be a partner. At least 80 characters."
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[14px] text-ink focus:border-accent focus:outline-none"
            />
            <p className="mt-1 text-[12px] text-faint">{message.trim().length} / 80 minimum</p>
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-ink-2">Website (optional)</label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourstudio.com"
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 font-mono text-[13px] text-ink focus:border-accent focus:outline-none"
            />
          </div>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={submit}
            className="btn-primary btn-sm disabled:opacity-50"
          >
            {busy ? "Submitting…" : "Apply for partnership"}
          </button>
        </div>
      )}
    </div>
  );
}
