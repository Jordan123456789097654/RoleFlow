"use client";

import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { usePathname } from "next/navigation";
import { Sparkles, Shield, Lock, ArrowRight, Zap } from "lucide-react";
import { CrackOverlay, ShockwaveRing } from "@/components/unveil/UnveilFx";
import { UnveilIntro } from "@/components/unveil/UnveilIntro";

interface CountdownLockdownGuardProps {
  isStaffOrAdmin: boolean;
  children: React.ReactNode;
}

export function CountdownLockdownGuard({ isStaffOrAdmin, children }: CountdownLockdownGuardProps) {
  const [targetTime, setTargetTime] = useState<number | null>(null);
  const [active, setActive] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; totalSeconds: number } | null>(null);
  const [completed, setCompleted] = useState<boolean>(false);
  const [earthquakeActive, setEarthquakeActive] = useState<boolean>(false);
  // True while the screen breaks open. The lock card animates out and the site is revealed underneath.
  const [tearing, setTearing] = useState<boolean>(false);
  const [ringKey, setRingKey] = useState<number | null>(null);
  // "real" for the launch, "preview" for staff. Set while the dark intro is playing.
  const [introMode, setIntroMode] = useState<null | "real" | "preview">(null);
  const [unlocked, setUnlocked] = useState<boolean>(false);
  // Staff see the countdown first, then choose to continue past it.
  const [staffBypassed, setStaffBypassed] = useState<boolean>(false);
  // Staff-only preview of the unlock animation. Never sends launch emails or unlocks the site.
  const [previewing, setPreviewing] = useState<boolean>(false);
  const pathname = usePathname();
  // The "why are you leaving" survey must stay reachable during the lockdown countdown.
  const alwaysOpen = pathname?.startsWith("/leaving/") ?? false;
  // ?clean=1 hides staff banners and controls, so a screen share shows only the public site.
  const [clean, setClean] = useState<boolean>(false);
  useEffect(() => {
    setClean(new URLSearchParams(window.location.search).get("clean") === "1");
  }, [pathname]);

  useEffect(() => {
    async function fetchLockdown() {
      try {
        const res = await fetch("/api/lockdown");
        if (res.ok) {
          const data = await res.json();
          if (data.active && data.targetDate) {
            const time = new Date(data.targetDate).getTime();
            setTargetTime(time);
            setActive(true);
          } else {
            setActive(false);
          }
        }
      } catch {
        // network error fallback
      }
    }
    fetchLockdown();
  }, []);

  useEffect(() => {
    if (!targetTime || !active) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });
        if (!completed) {
          setCompleted(true);
          triggerGrandUnlockSequence();
        }
      } else {
        const totalSeconds = Math.floor(diff / 1000);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, totalSeconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime, active, completed]);

  // Quake, then the screen breaks open, then the site is revealed.
  const runQuakeAndReveal = (isPreview: boolean) => {
    setEarthquakeActive(true);
    fireConfettiCannons();
    setTimeout(() => {
      setEarthquakeActive(false);
      setTearing(true);
      setRingKey(Date.now());
      fireSuperConfettiBurst();
    }, 2200);
    setTimeout(() => {
      setTearing(false);
      setRingKey(null);
      if (isPreview) {
        setPreviewing(false);
      } else {
        setUnlocked(true);
        setActive(false);
      }
    }, 3200);
  };

  const handleIntroDone = () => {
    const isPreview = introMode === "preview";
    setIntroMode(null);
    runQuakeAndReveal(isPreview);
  };

  // Real launch: the dark intro plays first, then the launch email goes out and the reveal runs.
  const triggerGrandUnlockSequence = () => {
    setIntroMode("real");
    // Launch email dispatch, sent once the countdown has finished
    try {
      fetch("/api/launch/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: "countdown_complete" }),
      });
    } catch {}

  };

  // Staff preview: same intro and reveal, but no email and no unlock.
  const playAnimationPreview = () => {
    if (previewing) return;
    setPreviewing(true);
    setIntroMode("preview");
  };

  const unlockLabel = targetTime
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(new Date(targetTime))
    : null;

  const fireConfettiCannons = () => {
    try {
      // Left bottom cannon
      confetti({
        particleCount: 70,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.9 },
        colors: ["#8b5cf6", "#a855f7", "#ec4899", "#f59e0b", "#ffffff"],
      });
      // Right bottom cannon
      confetti({
        particleCount: 70,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.9 },
        colors: ["#8b5cf6", "#a855f7", "#ec4899", "#f59e0b", "#ffffff"],
      });
    } catch {}
  };

  const fireSuperConfettiBurst = () => {
    try {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ["#8b5cf6", "#c084fc", "#e879f9", "#38bdf8", "#fbbf24"],
      });
    } catch {}
  };

  const isFinalFive = timeLeft !== null && timeLeft.totalSeconds > 0 && timeLeft.totalSeconds <= 5;

  // Staff or admin who chose to bypass the countdown
  if (isStaffOrAdmin && staffBypassed) {
    return (
      <>
        {active && !clean && (
          <div className="sticky top-0 z-50 flex items-center justify-between border-b border-violet-500/30 bg-[#160b2e] px-4 py-2 text-xs font-medium text-[#ddd6fe] backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-violet-400" />
              <span>
                <strong>Countdown Lockdown Active</strong> — Public visitors are restricted. Staff override active.
              </span>
            </div>
            {timeLeft && (
              <span className="font-mono text-violet-300">
                {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
              </span>
            )}
          </div>
        )}
        {children}
      </>
    );
  }

  // Not active or completely unlocked
  if (!active || unlocked || alwaysOpen) {
    return unlocked ? <div className="unveil-reveal">{children}</div> : <>{children}</>;
  }

  return (
    <div className={`relative min-h-screen bg-[#07080c] text-slate-100 overflow-hidden ${earthquakeActive ? "animate-earthquake" : ""}`}>
      {introMode && <UnveilIntro onDone={handleIntroDone} />}
      {/* The real site sits underneath and is revealed when the screen breaks open */}
      {(tearing || earthquakeActive) && (
        <div className="absolute inset-0 z-0 overflow-y-auto pointer-events-none">
          {children}
        </div>
      )}

      {/* Shockwave ring at the moment the screen breaks */}
      {ringKey !== null && <ShockwaveRing key={ringKey} />}

      {/* Restricted Lockdown Countdown Center Card */}
      {(
        <div className={`relative z-50 flex min-h-screen flex-col items-center justify-center p-6 selection:bg-violet-600/40 ${tearing ? "unveil-tear" : ""}`}>
          {earthquakeActive && <CrackOverlay />}
          {/* Radial Glow Aura */}
          <div
            className={`pointer-events-none absolute -top-40 left-1/2 h-[650px] w-[850px] -translate-x-1/2 rounded-full transition-all duration-700 blur-[100px] ${
              isFinalFive || earthquakeActive
                ? "bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.6)_0%,rgba(139,92,246,0.5)_40%,transparent_70%)] scale-125"
                : "bg-[radial-gradient(circle_at_center,rgba(90,42,162,0.45)_0%,rgba(67,29,130,0.25)_40%,transparent_70%)]"
            }`}
          />

          <div className="relative z-10 max-w-xl w-full text-center space-y-8">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all duration-300 ${
                isFinalFive || earthquakeActive
                  ? "border-pink-500/60 bg-pink-950/60 text-pink-300 shadow-[0_0_25px_rgba(236,72,153,0.5)] scale-105"
                  : "border-violet-500/30 bg-violet-950/50 text-[#ddd6fe]"
              }`}
            >
              {isFinalFive || earthquakeActive ? <Zap className="w-3.5 h-3.5 text-pink-400 animate-bounce" /> : <Lock className="w-3.5 h-3.5 text-violet-400" />}
              <span>{earthquakeActive ? "CRACKING VAULT SEALS..." : isFinalFive ? "FINAL SECONDS BEFORE CUTOVER" : "Restricted Platform Launch Window"}</span>
            </div>

            <div>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                Something greater is{" "}
                <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-white bg-clip-text text-transparent">
                  coming.
                </span>
              </h1>
              <p className="mt-4 text-sm sm:text-base text-slate-400 leading-relaxed">
                RoleFlow is undergoing final cutover. The platform unlocks publicly {unlockLabel ? <>on <strong>{unlockLabel}</strong></> : "soon"}.
              </p>
            </div>

            {isStaffOrAdmin && !clean && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setStaffBypassed(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-400/40 bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(139,92,246,0.35)] transition-all hover:bg-violet-500"
                >
                  <Shield className="h-4 w-4" /> Continue as staff
                </button>
                <button
                  type="button"
                  onClick={playAnimationPreview}
                  disabled={previewing}
                  className="ml-3 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition-all hover:bg-white/10 disabled:opacity-50"
                >
                  Preview unlock animation
                </button>
                <p className="text-xs text-slate-500">Only staff and admins see these buttons. Public visitors are held here until the countdown ends.</p>
              </div>
            )}

            {/* Countdown Clock with 5-Second Heartbeat Pulse (#6) */}
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div
                className={`rounded-2xl border p-4 backdrop-blur-md transition-all duration-300 ${
                  isFinalFive
                    ? "border-pink-500/50 bg-pink-500/10 shadow-[0_0_30px_rgba(236,72,153,0.4)] scale-105"
                    : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <span className="font-mono text-3xl sm:text-4xl font-extrabold text-white">
                  {timeLeft ? String(timeLeft.hours).padStart(2, "0") : "--"}
                </span>
                <span className="block mt-1 font-mono text-[10px] uppercase text-violet-400 tracking-wider">Hours</span>
              </div>

              <div
                className={`rounded-2xl border p-4 backdrop-blur-md transition-all duration-300 ${
                  isFinalFive
                    ? "border-pink-500/50 bg-pink-500/10 shadow-[0_0_30px_rgba(236,72,153,0.4)] scale-105"
                    : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <span className="font-mono text-3xl sm:text-4xl font-extrabold text-white">
                  {timeLeft ? String(timeLeft.minutes).padStart(2, "0") : "--"}
                </span>
                <span className="block mt-1 font-mono text-[10px] uppercase text-violet-400 tracking-wider">Minutes</span>
              </div>

              <div
                className={`rounded-2xl border p-4 backdrop-blur-md transition-all duration-300 ${
                  isFinalFive
                    ? "border-pink-500/70 bg-pink-500/20 text-pink-200 shadow-[0_0_35px_rgba(236,72,153,0.6)] scale-110 animate-pulse"
                    : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <span className={`font-mono text-3xl sm:text-4xl font-extrabold ${isFinalFive ? "text-pink-300" : "text-white"}`}>
                  {timeLeft ? String(timeLeft.seconds).padStart(2, "0") : "--"}
                </span>
                <span className="block mt-1 font-mono text-[10px] uppercase text-violet-400 tracking-wider">Seconds</span>
              </div>
            </div>

            {/* Staff Sign-In Access */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Staff / Admin Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://discord.gg/tKPbCXbmr9"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all"
              >
                Community Discord &rarr;
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
