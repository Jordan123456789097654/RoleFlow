"use client";

import React, { useEffect, useRef, useState } from "react";

type Stage = "typing" | "hold" | "fade";
type Beat = { text: string; className: string; hold: number; speed: number };

/** Opening sequence: a terminal boot, a mission statement, then the big RoleFlow v2 reveal. */
const BEATS: Beat[] = [
  { text: "> boot roleflow.core", className: "font-mono text-sm text-emerald-400 sm:text-base", hold: 500, speed: 35 },
  { text: "> loading applyhub ........ ok", className: "font-mono text-sm text-slate-400 sm:text-base", hold: 300, speed: 22 },
  { text: "> loading roster .......... ok", className: "font-mono text-sm text-slate-400 sm:text-base", hold: 300, speed: 22 },
  { text: "> loading rankhub ......... ok", className: "font-mono text-sm text-slate-400 sm:text-base", hold: 300, speed: 22 },
  { text: "> syncing communities ..... ok", className: "font-mono text-sm text-slate-400 sm:text-base", hold: 300, speed: 22 },
  { text: "> cutover status: READY", className: "font-mono text-sm font-bold text-emerald-300 sm:text-base", hold: 900, speed: 40 },
  { text: "Every community deserves better tools.", className: "font-serif text-2xl italic text-slate-300 sm:text-4xl", hold: 1800, speed: 55 },
  { text: "Hundreds of hours of applications.", className: "font-sans text-lg text-slate-400 sm:text-2xl", hold: 1300, speed: 40 },
  { text: "Hundreds of hours of rank changes.", className: "font-sans text-lg text-slate-400 sm:text-2xl", hold: 1300, speed: 40 },
  { text: "Hundreds of hours of staff shifts.", className: "font-sans text-lg text-slate-400 sm:text-2xl", hold: 1300, speed: 40 },
  { text: "So we rebuilt all of it.", className: "font-sans text-xl font-semibold text-white sm:text-3xl", hold: 1500, speed: 45 },
  { text: "Introducing", className: "font-mono text-4xl font-bold tracking-[0.18em] text-white sm:text-6xl", hold: 1400, speed: 70 },
  { text: "the next", className: "font-serif text-2xl italic text-slate-400 sm:text-3xl", hold: 900, speed: 160 },
  { text: "RoleFlow v2", className: "parent-shimmer-text bg-gradient-to-r from-violet-400 via-fuchsia-300 to-white bg-clip-text text-6xl font-black tracking-tight text-transparent sm:text-8xl", hold: 2000, speed: 90 },
  { text: "Faster. Simpler. Free forever.", className: "font-sans text-xl font-semibold tracking-wide text-white sm:text-3xl", hold: 1600, speed: 45 },
  { text: "One account. Every community tool.", className: "font-sans text-lg font-medium text-violet-300 sm:text-2xl", hold: 1500, speed: 40 },
  { text: "ApplyHub  ·  Roster  ·  RankHub", className: "font-mono text-base tracking-[0.3em] text-fuchsia-300 sm:text-xl", hold: 1600, speed: 50 },
  { text: "Built with you, for you.", className: "font-serif text-2xl italic text-slate-200 sm:text-4xl", hold: 1500, speed: 60 },
  { text: "Ready when you are.", className: "font-serif text-3xl italic text-slate-100 sm:text-5xl", hold: 1400, speed: 110 },
];

const FADE_MS = 500;
const TOTAL_MS = BEATS.reduce((sum, b) => sum + b.text.length * b.speed + b.hold + FADE_MS, 0);
// Deterministic particle layout so server and client markup agree.
const PARTICLES = Array.from({ length: 40 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i * 0.37) % 6,
  duration: 6 + ((i * 1.3) % 6),
  size: 1 + (i % 3),
}));

/**
 * Full-screen cinematic intro. A boot log, a mission statement, then the RoleFlow v2 reveal.
 * Types each line, holds it, fades it out, then moves on. Calls onDone after the last line.
 * A skip button ends it early. Reduced-motion users get a short pause instead.
 */
export function UnveilIntro({ onDone }: { onDone: () => void }) {
  const [beat, setBeat] = useState(0);
  const [typed, setTyped] = useState(0);
  const [stage, setStage] = useState<Stage>("typing");
  const [elapsed, setElapsed] = useState(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  // Overall progress bar, driven by elapsed time.
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - start), 100);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const t = setTimeout(() => doneRef.current(), 800);
      return () => clearTimeout(t);
    }

    const current = BEATS[beat];
    let t: ReturnType<typeof setTimeout>;
    if (stage === "typing") {
      t =
        typed < current.text.length
          ? setTimeout(() => setTyped(typed + 1), current.speed)
          : setTimeout(() => setStage("hold"), 200);
    } else if (stage === "hold") {
      t = setTimeout(() => setStage("fade"), current.hold);
    } else {
      t = setTimeout(() => {
        if (beat < BEATS.length - 1) {
          setBeat(beat + 1);
          setTyped(0);
          setStage("typing");
        } else {
          doneRef.current();
        }
      }, FADE_MS);
    }
    return () => clearTimeout(t);
  }, [beat, typed, stage]);

  const current = BEATS[beat];
  const progress = Math.min(100, (elapsed / TOTAL_MS) * 100);

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden bg-[#050409]">
      {/* Drifting grid */}
      <div aria-hidden="true" className="unveil-grid pointer-events-none absolute inset-[-50%] opacity-40" />
      {/* Violet and fuchsia glow that breathes behind the text */}
      <div aria-hidden="true" className="unveil-glow pointer-events-none absolute left-1/2 top-1/2 h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      {/* Rising particles */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="unveil-particle pointer-events-none absolute bottom-0 rounded-full bg-violet-300/70"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
      {/* Scanlines */}
      <div aria-hidden="true" className="unveil-scan pointer-events-none absolute inset-0 opacity-[0.07]" />

      {/* Skip */}
      <button
        type="button"
        onClick={() => doneRef.current()}
        className="absolute right-5 top-5 z-10 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-slate-300 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
      >
        Skip intro
      </button>

      {/* Caption stage */}
      <div className="relative flex h-full items-center justify-center">
        <div
          className={`max-w-4xl px-6 text-center transition-opacity ${stage === "fade" ? "opacity-0" : "opacity-100"}`}
          style={{ transitionDuration: `${FADE_MS}ms` }}
        >
          <span className={current.className}>{current.text.slice(0, typed)}</span>
          {stage === "typing" && (
            <span aria-hidden="true" className="ml-1 inline-block w-[0.08em] animate-pulse bg-violet-400 align-middle" style={{ height: "0.9em" }} />
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/5">
        <div className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-white transition-[width] duration-100" style={{ width: `${progress}%` }} />
      </div>
      <p aria-hidden="true" className="absolute bottom-4 right-5 font-mono text-[10px] uppercase tracking-widest text-slate-600">
        {String(beat + 1).padStart(2, "0")} / {String(BEATS.length).padStart(2, "0")}
      </p>
    </div>
  );
}
