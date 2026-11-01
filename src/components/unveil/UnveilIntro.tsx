"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronsRight, Maximize, Minimize } from "lucide-react";
import { ACTS, BEATS, FADE_MS, SETTLE_MS, TOTAL_MS, charMs, holdMs } from "@/components/unveil/unveil-beats";

type Stage = "typing" | "hold" | "fade";

/** Playback speeds the speed button cycles through. Applies to typing, holds and fades. */
const SPEEDS = [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.75, 2, 3, 4];

/** Where each beat starts on the unskipped timeline, so the progress bar still makes sense after skipping acts. */
const BEAT_START_MS = (() => {
  let t = 0;
  return BEATS.map((b) => {
    const start = t;
    t += b.text.length * charMs(b) + SETTLE_MS + holdMs(b) + FADE_MS;
    return start;
  });
})();

// Deterministic particle layout so server and client markup agree.
const PARTICLES = Array.from({ length: 56 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i * 0.37) % 6,
  duration: 6 + ((i * 1.3) % 6),
  size: 1 + (i % 3),
}));

/** One line of the boot log. "ok" glows green, READY is bold, the first line is the command. */
function TermLine({ line }: { line: string }) {
  if (line.includes("READY")) return <div className="font-bold text-emerald-300">{line}</div>;
  if (line.includes("boot roleflow")) return <div className="text-emerald-400">{line}</div>;
  if (line.includes("...") && line.endsWith("ok")) {
    return (
      <div className="text-slate-400">
        {line.slice(0, -2)}
        <span className="font-bold text-emerald-400">ok</span>
      </div>
    );
  }
  return <div className="text-slate-400">{line}</div>;
}

/**
 * Boot log. Lines that have not been typed yet are rendered invisible so the block keeps its
 * final height and the text does not slide up the screen as new lines arrive.
 */
function TerminalBlock({ full, typed }: { full: string; typed: string }) {
  const fullLines = full.split("\n");
  const typedLines = typed.split("\n");
  return (
    <div className="mx-auto w-[min(92vw,34rem)] whitespace-pre text-left font-mono text-xs leading-relaxed sm:text-base">
      {fullLines.map((line, i) =>
        i < typedLines.length ? (
          <TermLine key={i} line={typedLines[i]} />
        ) : (
          <div key={i} className="invisible">
            {line}
          </div>
        ),
      )}
    </div>
  );
}

/**
 * Full-screen cinematic launch intro. Ten acts (boot, the problem, the rebuild, a full act each for
 * ApplyHub, Roster and RankHub, better together, the promise, built with you, the reveal) played as typed lines on a living background. The words and pacing live in
 * unveil-beats.ts. Calls onDone after the last line. Skip button or Escape ends it early.
 * Reduced-motion users get a short pause instead.
 */
export function UnveilIntro({ onDone }: { onDone: () => void }) {
  const [beat, setBeat] = useState(0);
  const [typed, setTyped] = useState(0);
  const [stage, setStage] = useState<Stage>("typing");
  const [speedIdx, setSpeedIdx] = useState(0);
  const speed = SPEEDS[speedIdx];
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  // Fullscreen is requested on the whole page, not just the intro, so it carries on through the finale and into the site.
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = useCallback(() => {
    try {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void document.documentElement.requestFullscreen();
    } catch {
      // Not supported (some mobile browsers). The button just does nothing.
    }
  }, []);
  useEffect(() => {
    const sync = () => setIsFullscreen(!!document.fullscreenElement);
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const cycleSpeed = useCallback(() => setSpeedIdx((i) => (i + 1) % SPEEDS.length), []);
  const slower = useCallback(() => setSpeedIdx((i) => Math.max(0, i - 1)), []);
  const faster = useCallback(() => setSpeedIdx((i) => Math.min(SPEEDS.length - 1, i + 1)), []);

  // Jump to the title card of the next act. After the last act this ends the intro.
  const skipAct = useCallback(() => {
    const next = BEATS.findIndex((b, i) => i > beat && b.act > BEATS[beat].act);
    if (next === -1) {
      doneRef.current();
      return;
    }
    setBeat(next);
    setTyped(0);
    setStage("typing");
  }, [beat]);

  // Escape skips.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") doneRef.current();
      else if (e.key === "f" || e.key === "F") toggleFullscreen();
      else if (e.key === "s" || e.key === "S") cycleSpeed();
      else if (e.key === "]" || e.key === "+" || e.key === "=" || e.key === "ArrowUp") faster();
      else if (e.key === "[" || e.key === "-" || e.key === "ArrowDown") slower();
      else if (e.key === "ArrowRight") skipAct();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleFullscreen, cycleSpeed, faster, slower, skipAct]);

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
          ? setTimeout(() => setTyped(typed + 1), charMs(current) / speed)
          : setTimeout(() => setStage("hold"), SETTLE_MS / speed);
    } else if (stage === "hold") {
      t = setTimeout(() => setStage("fade"), holdMs(current) / speed);
    } else {
      t = setTimeout(() => {
        if (beat < BEATS.length - 1) {
          setBeat(beat + 1);
          setTyped(0);
          setStage("typing");
        } else {
          doneRef.current();
        }
      }, FADE_MS / speed);
    }
    return () => clearTimeout(t);
  }, [beat, typed, stage, speed]);

  const current = BEATS[beat];
  const act = ACTS[current.act];
  const progress = Math.min(100, (BEAT_START_MS[beat] / TOTAL_MS) * 100);
  const typedText = current.text.slice(0, typed);
  const finished = stage !== "typing";
  const kind = current.kind ?? "text";

  return (
    <div
      className="fixed inset-0 z-[80] overflow-hidden bg-[#050409]"
      role="dialog"
      aria-modal="true"
      aria-label="RoleFlow v2 launch intro"
    >
      {/* Drifting grid */}
      <div aria-hidden="true" className="unveil-grid pointer-events-none absolute inset-[-50%] opacity-40" />
      {/* Glow that breathes behind the text. Its colour eases from act to act. */}
      <div
        aria-hidden="true"
        className="unveil-glow pointer-events-none absolute left-1/2 top-1/2 h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ ["--u-a" as string]: act.glowA, ["--u-b" as string]: act.glowB }}
      />
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
      {/* Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.65) 100%)" }}
      />
      {/* Screen flash on big moments */}
      {current.fx === "flash" && <div key={`flash-${beat}`} aria-hidden="true" className="unveil-flash" />}

      {/* Act label */}
      <p
        key={current.act}
        aria-hidden="true"
        className="unveil-act-label absolute left-5 top-16 font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500 sm:top-5 sm:text-xs"
      >
        {String(current.act).padStart(2, "0")} · {act.name}
      </p>

      {/* Fullscreen and skip */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 sm:right-5 sm:top-5 sm:gap-2">
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
          className="rounded-lg border border-white/15 bg-white/5 p-2 text-slate-300 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
        <div className="flex items-center overflow-hidden rounded-lg border border-white/15 bg-white/5 font-mono text-xs text-slate-300 backdrop-blur-md" title="Speed ([ ] or - +, S to cycle)">
          <button type="button" onClick={slower} disabled={speedIdx === 0} aria-label="Slower" className="px-2 py-1.5 hover:bg-white/10 hover:text-white disabled:opacity-30">
            −
          </button>
          <button type="button" onClick={cycleSpeed} aria-label={`Playback speed ${speed}x. Click to cycle.`} className="min-w-[3rem] px-1 py-1.5 tracking-wider hover:bg-white/10 hover:text-white">
            {speed}x
          </button>
          <button type="button" onClick={faster} disabled={speedIdx === SPEEDS.length - 1} aria-label="Faster" className="px-2 py-1.5 hover:bg-white/10 hover:text-white disabled:opacity-30">
            +
          </button>
        </div>
        <button
          type="button"
          onClick={skipAct}
          title="Skip to next act (→)"
          className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 font-mono text-xs uppercase tracking-widest text-slate-300 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white sm:px-3"
        >
          <span>Skip act</span>
          <ChevronsRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => doneRef.current()}
          className="rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 font-mono text-xs uppercase tracking-widest text-slate-300 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white sm:px-3"
        >
          Skip intro
        </button>
      </div>

      {/* Caption stage */}
      <div className="relative flex h-full items-center justify-center">
        <div
          className={`max-w-4xl px-6 text-center transition-opacity ${stage === "fade" ? "opacity-0" : "opacity-100"}`}
          style={{ transitionDuration: `${FADE_MS / speed}ms` }}
        >
          {/* Screen readers get the finished line once, not every keystroke. */}
          <p className="sr-only" aria-live="polite">
            {[current.text.replace(/\n/g, ". "), current.sub].filter(Boolean).join(" ")}
          </p>

          <div aria-hidden="true">
            {kind === "terminal" ? (
              <TerminalBlock full={current.text} typed={typedText} />
            ) : (
              <>
                <span className={`${current.className} ${current.fx === "glitch" && finished ? "unveil-glitch" : ""}`}>{typedText}</span>
                {stage === "typing" && (
                  <span className="ml-1 inline-block w-[0.08em] animate-pulse bg-violet-400 align-middle" style={{ height: "0.9em" }} />
                )}
              </>
            )}

            {current.sub && (
              <p
                className={`mt-5 transition-all duration-700 ${finished ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"} ${current.subClassName ?? ""}`}
              >
                {current.sub}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Act pips */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-7 flex items-center justify-center gap-2">
        {ACTS.map((a, i) => (
          <span
            key={a.name}
            className={`h-1.5 rounded-full transition-all duration-700 ${
              i === current.act ? "w-8 bg-violet-400" : i < current.act ? "w-3 bg-violet-400/50" : "w-3 bg-white/15"
            }`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-white transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p aria-hidden="true" className="absolute bottom-4 right-5 font-mono text-[10px] uppercase tracking-widest text-slate-600">
        {String(beat + 1).padStart(2, "0")} / {String(BEATS.length).padStart(2, "0")}
      </p>
    </div>
  );
}
