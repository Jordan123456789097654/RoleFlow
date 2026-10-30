"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Shield, Lock, ArrowRight, CheckCircle2 } from "lucide-react";

interface CountdownLockdownGuardProps {
  isStaffOrAdmin: boolean;
  children: React.ReactNode;
}

export function CountdownLockdownGuard({ isStaffOrAdmin, children }: CountdownLockdownGuardProps) {
  const [targetTime, setTargetTime] = useState<number | null>(null);
  const [active, setActive] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [completed, setCompleted] = useState<boolean>(false);
  const [animatingUnlock, setAnimatingUnlock] = useState<boolean>(false);
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
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        if (!completed) {
          setCompleted(true);
          triggerUnlockSequence();
        }
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime, active, completed]);

  const triggerUnlockSequence = async () => {
    setAnimatingUnlock(true);

    // Call API to trigger launch email blast across all emails
    try {
      fetch("/api/launch/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: "countdown_complete" }),
      });
    } catch {}

    // Play unlocking cosmic animation for 4.5 seconds then grant access
    setTimeout(() => {
      setUnlocked(true);
      setAnimatingUnlock(false);
      setActive(false);
    }, 4500);
  };

  // If staff or admin, provide bypass banner at top
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

  // If lockdown is not active or unlocked, display children
  if (!active || unlocked) {
    return <>{children}</>;
  }

  // ANIMATION: Countdown reached zero, explosive cosmic unlock
  if (animatingUnlock) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#07080c] text-white overflow-hidden">
        {/* Expanding energy ripples */}
        <div className="absolute h-96 w-96 rounded-full bg-violet-600/30 blur-3xl animate-ping" />
        <div className="absolute h-[600px] w-[600px] rounded-full bg-indigo-500/20 blur-[100px] animate-pulse" />

        <div className="relative z-10 text-center space-y-6 px-4 animate-fade-in">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-violet-400/50 bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-[0_0_50px_rgba(139,92,246,0.8)] animate-bounce">
            <Sparkles className="h-12 w-12 text-white" />
          </div>

          <span className="inline-block rounded-full border border-violet-400/40 bg-violet-500/20 px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-violet-200 shadow-lg">
            Launching Platform Now
          </span>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-indigo-300">
            Welcome to the New RoleFlow.
          </h1>

          <p className="text-base text-violet-200 max-w-lg mx-auto">
            Countdown complete. Unlocking ApplyHub, community management suites, and parent network...
          </p>
        </div>
      </div>
    );
  }

  // RESTRICTED SCREEN: Countdown Active
  return (
    <div className="relative min-h-screen bg-[#07080c] text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-violet-600/40 overflow-hidden">
      {/* Background Aura */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(90,42,162,0.45)_0%,rgba(67,29,130,0.25)_40%,transparent_70%)] blur-[90px]" />

      <div className="relative z-10 max-w-xl w-full text-center space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-950/50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#ddd6fe] backdrop-blur-md">
          <Lock className="w-3.5 h-3.5 text-violet-400" />
          <span>Restricted Platform Launch Window</span>
        </div>

        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Something greater is <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-white bg-clip-text text-transparent">coming.</span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-400 leading-relaxed">
            RoleFlow is currently in final cutover mode. The platform unlocks publicly today at <strong>9:00 PM EDT</strong>.
          </p>
        </div>

        {/* Live Countdown Display */}
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
            <span className="font-mono text-3xl sm:text-4xl font-extrabold text-white">
              {timeLeft ? String(timeLeft.hours).padStart(2, "0") : "--"}
            </span>
            <span className="block mt-1 font-mono text-[10px] uppercase text-violet-400 tracking-wider">Hours</span>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
            <span className="font-mono text-3xl sm:text-4xl font-extrabold text-white">
              {timeLeft ? String(timeLeft.minutes).padStart(2, "0") : "--"}
            </span>
            <span className="block mt-1 font-mono text-[10px] uppercase text-violet-400 tracking-wider">Minutes</span>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
            <span className="font-mono text-3xl sm:text-4xl font-extrabold text-white">
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
  );
}
