"use client";

import React, { useState, useEffect } from "react";

export function ParentCountdownBanner({
  targetDate,
  label,
}: {
  targetDate: string;
  label?: string | null;
}) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    function calculate() {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds });
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className="mx-auto mb-8 max-w-xl rounded-2xl border border-violet-500/30 bg-gradient-to-r from-[#1f0b4a]/80 via-[#431d82]/40 to-[#1f0b4a]/80 p-4 text-center shadow-[0_0_25px_rgba(90,42,162,0.3)] backdrop-blur-md">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#ddd6fe]">
        {label || "Next Product Launch Countdown"}
      </p>
      <div className="mt-2 flex items-center justify-center gap-4 text-white">
        <div className="flex flex-col items-center">
          <span className="font-mono text-2xl font-bold sm:text-3xl">{timeLeft.days}</span>
          <span className="text-[10px] uppercase text-slate-400">Days</span>
        </div>
        <span className="text-xl font-bold text-violet-400">:</span>
        <div className="flex flex-col items-center">
          <span className="font-mono text-2xl font-bold sm:text-3xl">{timeLeft.hours}</span>
          <span className="text-[10px] uppercase text-slate-400">Hours</span>
        </div>
        <span className="text-xl font-bold text-violet-400">:</span>
        <div className="flex flex-col items-center">
          <span className="font-mono text-2xl font-bold sm:text-3xl">{timeLeft.minutes}</span>
          <span className="text-[10px] uppercase text-slate-400">Mins</span>
        </div>
        <span className="text-xl font-bold text-violet-400">:</span>
        <div className="flex flex-col items-center">
          <span className="font-mono text-2xl font-bold sm:text-3xl">{timeLeft.seconds}</span>
          <span className="text-[10px] uppercase text-slate-400">Secs</span>
        </div>
      </div>
    </div>
  );
}
