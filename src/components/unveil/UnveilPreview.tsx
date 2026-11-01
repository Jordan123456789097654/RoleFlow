"use client";

import React, { useEffect, useState } from "react";
import { UnveilFinale } from "@/components/unveil/UnveilFx";
import { UnveilIntro } from "@/components/unveil/UnveilIntro";

type Phase = "intro" | "finale" | "done";

const PreviewCard = (
  <div className="flex h-full min-h-screen items-center justify-center bg-gradient-to-br from-[#1f0b4a] via-[#130826] to-[#07080c]">
    <div className="max-w-md px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#ddd6fe]">Preview</p>
      <h2 className="mt-3 text-3xl font-black text-white">This is where visitors land.</h2>
      <p className="mt-3 text-sm text-slate-300">Nothing was sent or unlocked. This only shows the animation.</p>
    </div>
  </div>
);

/**
 * Admin-only preview of the full unlock: dark typewriter intro, then light collapses to a point
 * and an iris opens onto the site. It never calls the launch broadcast and never changes the lockdown setting.
 */
export function UnveilPreview({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [run, setRun] = useState(0);

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
      {phase === "done" && <div className="absolute inset-0">{PreviewCard}</div>}
      {phase === "intro" && <UnveilIntro key={run} onDone={() => setPhase("finale")} />}
      {phase === "finale" && <UnveilFinale key={run} reveal={PreviewCard} onDone={() => setPhase("done")} />}

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
