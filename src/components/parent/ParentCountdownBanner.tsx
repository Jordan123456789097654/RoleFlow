"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type Remaining = { days: number; hours: number; minutes: number; seconds: number };

function remainingUntil(targetDate: string): Remaining | null {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (!Number.isFinite(diff) || diff <= 0) return null;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function Unit({ value, label }: { value: number; label: string }) {
  const text = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1.5">
        {text.split("").map((digit, index) => (
          <span
            // Re-keying on the digit makes each change flip in.
            key={`${label}-${index}-${digit}`}
            className="parent-flip flex h-16 w-11 items-center justify-center rounded-xl border border-violet-500/30 bg-[#130826]/80 font-mono text-3xl font-bold tabular-nums text-white shadow-[0_0_18px_rgba(90,42,162,0.35)] sm:h-20 sm:w-14 sm:text-4xl"
          >
            {digit}
          </span>
        ))}
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</span>
    </div>
  );
}

export function ParentCountdownBanner({
  targetDate,
  label,
}: {
  targetDate: string;
  label?: string | null;
}) {
  // null until mounted, so the server render and first client render match.
  const [remaining, setRemaining] = useState<Remaining | null | undefined>(undefined);

  useEffect(() => {
    const tick = () => setRemaining(remainingUntil(targetDate));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const heading = label || "Next product launch";

  if (remaining === undefined) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-violet-500/30 bg-[#130826]/60 p-8 text-center" aria-hidden="true">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#ddd6fe]">{heading}</p>
        <div className="mt-6 h-20" />
      </div>
    );
  }

  if (remaining === null) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">{heading}</p>
        <p className="mt-3 text-2xl font-extrabold text-white">It is launch day.</p>
        <Link href="/products" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500">
          See the products &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="parent-ring mx-auto max-w-2xl rounded-3xl border border-violet-500/30 bg-gradient-to-br from-[#1f0b4a]/80 via-[#431d82]/30 to-[#130826]/80 p-6 text-center backdrop-blur-md sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#ddd6fe]">{heading}</p>
      <div className="mt-6 flex flex-wrap items-start justify-center gap-4 sm:gap-6">
        <Unit value={remaining.days} label="Days" />
        <Unit value={remaining.hours} label="Hours" />
        <Unit value={remaining.minutes} label="Minutes" />
        <Unit value={remaining.seconds} label="Seconds" />
      </div>
    </div>
  );
}
