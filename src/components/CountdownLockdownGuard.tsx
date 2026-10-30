"use client";

import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Sparkles, Shield, Lock, ArrowRight, Zap } from "lucide-react";

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
  const [vaultOpening, setVaultOpening] = useState<boolean>(false);
  const [unlocked, setUnlocked] = useState<boolean>(false);

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

  const triggerGrandUnlockSequence = () => {
    // 1. PHASE 1: Earth Cracking & Screen Shaking (0s to 2.2s)
    setEarthquakeActive(true);

    // Blast initial corner confetti cannons
    fireConfettiCannons();

    // Trigger backend launch email dispatch
    try {
      fetch("/api/launch/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: "countdown_complete" }),
      });
    } catch {}

    // 2. PHASE 2: Vault Door Split & Energy Shockwave (at 2.2s)
    setTimeout(() => {
      setEarthquakeActive(false);
      setVaultOpening(true);
      fireSuperConfettiBurst();
    }, 2200);

    // 3. PHASE 3: Complete Reveal (at 4.6s)
    setTimeout(() => {
      setUnlocked(true);
      setActive(false);
      setVaultOpening(false);
    }, 4600);
  };

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

  // Staff or admin bypass
  if (isStaffOrAdmin) {
    return (
      <>
        {active && (
          <div className="sticky top-0 z-50 flex items-center justify-between border-b border-violet-500/30 bg-[#160b2e] px-4 py-2 text-xs font-medium text-[#ddd6fe] backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-violet-400" />
              <span>
                <strong>Countdown Lockdown Active (9:00 PM EDT)</strong> — Public visitors are restricted. Staff override active.
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
  if (!active || unlocked) {
    return <>{children}</>;
  }

  return (
    <div className={`relative min-h-screen bg-[#07080c] text-slate-100 overflow-hidden ${earthquakeActive ? "animate-earthquake" : ""}`}>
      {/* Underlying actual site being revealed through vault split */}
      {(vaultOpening || earthquakeActive) && (
        <div className="absolute inset-0 z-0 overflow-y-auto pointer-events-none opacity-90 transition-opacity duration-1000">
          {children}
        </div>
      )}

      {/* Vault Left Half Door */}
      <div
        className={`fixed inset-y-0 left-0 w-1/2 z-40 bg-[#08090f] border-r border-violet-500/40 shadow-2xl flex items-center justify-end pr-4 ${
          vaultOpening ? "animate-vault-left" : ""
        }`}
      >
        {/* Decorative mechanical seam */}
        <div className="h-full w-2 bg-gradient-to-b from-transparent via-violet-500/40 to-transparent" />
      </div>

      {/* Vault Right Half Door */}
      <div
        className={`fixed inset-y-0 right-0 w-1/2 z-40 bg-[#08090f] border-l border-violet-500/40 shadow-2xl flex items-center justify-start pl-4 ${
          vaultOpening ? "animate-vault-right" : ""
        }`}
      >
        {/* Decorative mechanical seam */}
        <div className="h-full w-2 bg-gradient-to-b from-transparent via-violet-500/40 to-transparent" />
      </div>

      {/* Earth-Crack Energy Shockwave Center Seam */}
      {earthquakeActive && (
        <div className="fixed inset-y-0 left-1/2 -translate-x-1/2 z-50 w-3 bg-gradient-to-b from-violet-400 via-white to-violet-500 shadow-[0_0_40px_rgba(255,255,255,0.9),0_0_80px_rgba(139,92,246,1)] animate-pulse" />
      )}

      {/* Restricted Lockdown Countdown Center Card */}
      {!vaultOpening && (
        <div className="relative z-50 flex min-h-screen flex-col items-center justify-center p-6 selection:bg-violet-600/40">
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
                RoleFlow is undergoing final cutover. The platform unlocks publicly today at <strong>9:00 PM EDT</strong>.
              </p>
            </div>

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
