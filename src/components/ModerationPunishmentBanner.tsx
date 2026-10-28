"use client";

import React, { useState } from "react";
import { AlertOctagon, ExternalLink, ShieldAlert, X } from "lucide-react";

interface ModerationPunishmentBannerProps {
  isBanned?: boolean;
}

export function ModerationPunishmentBanner({ isBanned }: ModerationPunishmentBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!isBanned || dismissed) return null;

  return (
    <div className="relative z-50 bg-gradient-to-r from-red-950/90 via-red-900/95 to-red-950/90 border-b border-red-500/40 text-red-100 px-4 py-3 shadow-xl backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0 text-red-400">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-red-200 uppercase tracking-wider text-[11px] block sm:inline sm:mr-2">
              [Account Restriction Notice]
            </span>
            <span>
              Your account has been restricted by Trust & Safety for policy violations. Submissions and management actions are restricted.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://discord.gg/tKPbCXbmr9"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-xs transition shadow-sm"
          >
            Submit Appeal
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => setDismissed(true)}
            title="Dismiss notice"
            className="p-1.5 rounded-md hover:bg-red-800/40 text-red-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
