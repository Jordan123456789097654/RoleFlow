"use client";

import React, { useEffect, useState } from "react";
import { CrackOverlay, ShockwaveRing } from "@/components/unveil/UnveilFx";
import { UnveilIntro } from "@/components/unveil/UnveilIntro";

type Phase = "intro" | "quake" | "tear" | "done";

/**
 * Admin-only preview of the full unlock: dark typewriter intro, then the screen
 * shakes and cracks, breaks open, and reveals the site. It never calls the launch
 * broadcast and never changes the lockdown setting.
 */
export function UnveilPreview({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (phase === "quake") {
      const t = setTimeout(() => setPhase("tear"), 2200);
      return () => clearTimeout(t);
    }
    if (phase === "tear") {
      const t = setTimeout(() => setPhase("done"), 1000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const replay = () => {
    setPhase("intro");
    setRun((r) => r + 1);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Unlock animation preview" className="fixed inset-0 z-[100] overflow-hidden bg-[#07080c]">
      {/* Revealed layer, shown once the screen breaks open */}
      <div
        className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1f0b4a] via-[#130826] to-[#07080c] ${
          phase === "tear" ? "unveil-reveal" : phase === "done" ? "" : "opacity-0"
        }`}
      >
        <div className="max-w-md px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#ddd6fe]">Preview</p>
          <h2 className="mt-3 text-3xl font-black text-white">This is where visitors land.</h2>
          <p className="mt-3 text-sm text-slate-300">Nothing was sent or unlocked. This only shows the animation.</p>
        </div>
      </div>

      {/* Locked layer: shakes, cracks, then tears away */}
      {(phase === "quake" || phase === "tear") && (
        <div className={`absolute inset-0 flex items-center justify-center bg-[#07080c] ${phase === "quake" ? "animate-earthquake" : "unveil-tear"}`}>
          {phase === "quake" && <CrackOverlay />}
          <div className="relative z-10 max-w-md px-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#ddd6fe]">Restricted Platform Launch Window</p>
            <h2 className="mt-3 text-4xl font-black text-white">
              Something greater is <span className="text-violet-400">coming.</span>
            </h2>
          </div>
        </div>
      )}

      {phase === "tear" && <ShockwaveRing />}

      {phase === "intro" && <UnveilIntro key={run} onDone={() => setPhase("quake")} />}

      <div className="fixed bottom-6 left-1/2 z-[110] flex -translate-x-1/2 gap-3">
        <button type="button" onClick={replay} className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-violet-500">
          Replay
        </button>
        <button type="button" onClick={onClose} className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20">
          Close
        </button>
      </div>
    </div>
  );
}
