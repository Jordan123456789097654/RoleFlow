"use client";

import React, { useState } from "react";
import { ExternalLink, X } from "lucide-react";

interface ModerationPunishmentBannerProps {
  isBanned?: boolean;
}

export function ModerationPunishmentBanner({ isBanned }: ModerationPunishmentBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!isBanned || dismissed) return null;

  return (
    <div className="relative z-50 border-b border-danger bg-danger text-paper">
      <div className="page-wrap flex flex-col items-start justify-between gap-3 py-3 text-[14px] sm:flex-row sm:items-center">
        <p>
          <span className="mr-2 font-mono text-[11px] uppercase tracking-wider opacity-80">Account restricted</span>
          Trust &amp; Safety has restricted this account for policy violations. Submissions and management actions are unavailable.
        </p>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href="https://discord.gg/tKPbCXbmr9"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[32px] items-center gap-1.5 rounded-md border border-paper/40 px-3 py-1 text-[13px] font-medium transition-colors hover:bg-paper hover:text-danger"
          >
            Submit an appeal
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            title="Dismiss notice"
            aria-label="Dismiss notice"
            className="grid h-8 w-8 place-items-center rounded-md transition-colors hover:bg-paper/15"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
