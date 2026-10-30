"use client";

import React, { useEffect, useRef, useState } from "react";

type Beat = { text: string; className: string; hold: number; speed: number };

/** Each beat has its own look: a mono headline, a small italic aside, and a big shimmering reveal. */
const BEATS: Beat[] = [
  {
    text: "Introducing",
    className: "font-mono text-4xl font-bold tracking-[0.18em] text-white sm:text-6xl",
    hold: 1400,
    speed: 70,
  },
  {
    text: "the next",
    className: "font-serif text-2xl italic text-slate-400 sm:text-3xl",
    hold: 900,
    speed: 160,
  },
  {
    text: "RoleFlow v2",
    className:
      "parent-shimmer-text bg-gradient-to-r from-violet-400 via-fuchsia-300 to-white bg-clip-text text-6xl font-black tracking-tight text-transparent sm:text-8xl",
    hold: 1800,
    speed: 90,
  },
  {
    text: "Faster. Simpler. Free forever.",
    className: "font-sans text-xl font-semibold tracking-wide text-white sm:text-3xl",
    hold: 1600,
    speed: 45,
  },
  {
    text: "One account. Every community tool.",
    className: "font-sans text-lg font-medium text-violet-300 sm:text-2xl",
    hold: 1600,
    speed: 40,
  },
  {
    text: "Ready when you are.",
    className: "font-serif text-3xl italic text-slate-200 sm:text-5xl",
    hold: 1400,
    speed: 110,
  },
];

const FADE_MS = 500;

/**
 * Full-screen dark intro. Types each line, holds it, fades it out, then moves on.
 * Calls onDone after the last line fades. Reduced-motion users get a short pause instead.
 */
export function UnveilIntro({ onDone }: { onDone: () => void }) {
  const [beat, setBeat] = useState(0);
  const [typed, setTyped] = useState(0);
  const [stage, setStage] = useState<"typing" | "hold" | "fade">("typing");
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

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
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black">
      <div
        className={`px-6 text-center transition-opacity ${stage === "fade" ? "opacity-0" : "opacity-100"}`}
        style={{ transitionDuration: `${FADE_MS}ms` }}
      >
        <span className={current.className}>{current.text.slice(0, typed)}</span>
        {stage === "typing" && (
          <span aria-hidden="true" className="ml-1 inline-block w-[0.08em] animate-pulse bg-violet-400 align-middle" style={{ height: "0.9em" }} />
        )}
      </div>
    </div>
  );
}
