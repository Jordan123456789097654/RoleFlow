"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, X, ArrowRight, CheckCircle2, Megaphone } from "lucide-react";

interface ChangelogData {
  id: string;
  version: string;
  title: string;
  content: string;
  tag: string;
  publishedAt: string;
}

export function ChangelogBroadcastModal() {
  const [changelog, setChangelog] = useState<ChangelogData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function checkLatestChangelog() {
      try {
        const res = await fetch("/api/changelog?latest=true");
        if (res.ok) {
          const data = await res.json();
          if (data.latest) {
            const seenId = localStorage.getItem("roleflow_seen_changelog_id");
            if (seenId !== data.latest.id) {
              setChangelog(data.latest);
              setIsOpen(true);
            }
          }
        }
      } catch (e) {
        // Silent fail
      }
    }

    checkLatestChangelog();
  }, []);

  const handleDismiss = () => {
    if (changelog) {
      localStorage.setItem("roleflow_seen_changelog_id", changelog.id);
    }
    setIsOpen(false);
  };

  if (!isOpen || !changelog) return null;

  const tagColors: Record<string, string> = {
    MAJOR: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    FEATURE: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    IMPROVEMENT: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    HOTFIX: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="glass-panel border border-purple-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative overflow-hidden bg-gradient-to-b from-[#13111C] to-[#0A090F]">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-mono font-bold text-white tracking-wider">
                  {changelog.version}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    tagColors[changelog.tag] || tagColors.FEATURE
                  }`}
                >
                  {changelog.tag}
                </span>
              </div>
              <h2 className="text-lg font-black text-white">{changelog.title}</h2>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-3 relative z-10 max-h-72 overflow-y-auto">
          <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
            {changelog.content}
          </p>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 relative z-10 border-t border-white/5">
          <span className="text-[11px] text-slate-500 font-mono">
            Published {new Date(changelog.publishedAt).toLocaleDateString()}
          </span>
          <button
            onClick={handleDismiss}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-600/30 flex items-center gap-2"
          >
            <span>Awesome, Got it!</span>
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
