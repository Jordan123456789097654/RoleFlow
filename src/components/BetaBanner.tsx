"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Bug, Lightbulb, X, ArrowRight } from "lucide-react";

export function BetaBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const isDismissed = localStorage.getItem("rf_beta_banner_dismissed_v1");
    if (!isDismissed) {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("rf_beta_banner_dismissed_v1", "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="relative z-40 bg-gradient-to-r from-purple-950/80 via-violet-900/60 to-purple-950/80 border-b border-purple-500/20 backdrop-blur-md px-4 py-2 text-xs text-slate-200">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>OPEN BETA</span>
          </span>
          <span className="text-slate-300 text-xs hidden sm:inline">
            RoleFlow is in active public beta — features are actively evolving and you may spot minor quirks.
          </span>
          <span className="text-slate-300 text-xs sm:hidden">
            RoleFlow is currently in Public Beta.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/feedback"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-all border border-white/10 text-[11px]"
          >
            <Bug className="w-3 h-3 text-rose-300" />
            <span>Report a Bug</span>
            <span className="text-slate-400 mx-0.5">•</span>
            <Lightbulb className="w-3 h-3 text-amber-300" />
            <span>Suggest Feature</span>
            <ArrowRight className="w-3 h-3 text-purple-300 ml-0.5" />
          </Link>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
