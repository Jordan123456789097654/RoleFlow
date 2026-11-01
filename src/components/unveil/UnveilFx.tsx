"use client";

import React, { useEffect, useState } from "react";

/** How long the three shutters sit closed coming online, then how long they take to lift. Keep in sync with globals.css. */
export const HOLD_MS = 1700;
export const LIFT_MS = 1800;

const SHUTTERS = [
  { name: "ApplyHub", note: "Recruitment", color: "139 92 246" },
  { name: "Roster", note: "Your team", color: "56 189 248" },
  { name: "RankHub", note: "Ranking", color: "232 121 249" },
];

/**
 * The finale that plays after the last act. Three shutters, one per tool, cover the screen.
 * Each one comes online in turn (a bar fills, then a LIVE badge lights up), echoing the boot log
 * the intro opened with. Then the shutters lift away one after another and the site settles
 * into place behind them, with a small "RoleFlow v2 is live" tag.
 *
 * `reveal` is whatever sits under the shutters: the live site for the real launch, a placeholder for the admin preview.
 */
export function UnveilFinale({ reveal, onDone }: { reveal: React.ReactNode; onDone: () => void }) {
  const [phase, setPhase] = useState<"hold" | "lift">("hold");

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const t = setTimeout(onDone, 400);
      return () => clearTimeout(t);
    }
    const toLift = setTimeout(() => setPhase("lift"), HOLD_MS);
    const toDone = setTimeout(onDone, HOLD_MS + LIFT_MS);
    return () => {
      clearTimeout(toLift);
      clearTimeout(toDone);
    };
    // onDone is intentionally not a dependency: the timers must run once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lifting = phase === "lift";

  return (
    <div className="fixed inset-0 z-[90] overflow-hidden bg-[#050409]" aria-hidden="true">
      {/* Site, settling into place as the shutters leave */}
      <div className={`unveil-site absolute inset-0 overflow-y-auto pointer-events-none ${lifting ? "unveil-site-in" : ""}`}>{reveal}</div>

      {/* Three shutters */}
      {SHUTTERS.map((s, i) => (
        <div
          key={s.name}
          className={`unveil-shutter ${lifting ? "unveil-shutter-lift" : ""}`}
          style={{ ["--i" as string]: i, ["--c" as string]: s.color, left: `${(i * 100) / 3}%`, width: `${100 / 3 + 0.2}%` }}
        >
          <div className="flex h-full flex-col items-center justify-center gap-4 px-2 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-400 sm:text-xs">{s.note}</p>
            <p className="font-sans text-xl font-black tracking-tight text-white sm:text-5xl">{s.name}</p>
            <div className="unveil-bar" />
            <p className="unveil-live font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-emerald-300 sm:text-sm">Live</p>
          </div>
        </div>
      ))}

      {/* Tag that appears once the site is open */}
      {lifting && (
        <p className="unveil-tag absolute inset-x-0 bottom-10 text-center font-mono text-xs uppercase tracking-[0.4em] text-white sm:text-sm">
          RoleFlow v2 · Live today
        </p>
      )}
    </div>
  );
}
