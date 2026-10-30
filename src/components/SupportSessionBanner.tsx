"use client";

import { useEffect, useState } from "react";

/** Shown on every page while a diagnostic session is open: who the session is for, the ticket, time left, and End session. */
export default function SupportSessionBanner({ username, expiresAt, ticketRef }: { username: string; expiresAt: number; ticketRef: string | null }) {
  const [now, setNow] = useState(() => Date.now());
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const left = Math.max(0, expiresAt - now);
  const expired = left === 0;
  const mins = Math.floor(left / 60000);
  const secs = Math.floor((left % 60000) / 1000);

  useEffect(() => {
    if (expired) window.location.reload();
  }, [expired]);

  const endSession = async () => {
    setEnding(true);
    try {
      await fetch("/api/support/end-session", { method: "POST", credentials: "same-origin" });
    } finally {
      window.location.assign("/support/panel");
    }
  };

  return (
    <div className="sticky top-0 z-[60] flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs text-ink">
      <span>
        Support session for <strong>{username}</strong>
        {ticketRef ? <> · Ticket <span className="font-mono">{ticketRef}</span></> : null}
        {" · "}
        <span className="font-mono font-semibold">{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</span> left
      </span>
      <button
        onClick={endSession}
        disabled={ending}
        className="rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-rose-500 disabled:opacity-40"
      >
        {ending ? "Ending..." : "End session"}
      </button>
    </div>
  );
}
