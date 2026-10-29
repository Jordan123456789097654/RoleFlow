"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";

export function BetaBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem("rf_beta_banner_dismissed_v1");
      if (!isDismissed) setDismissed(false);
    } catch {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem("rf_beta_banner_dismissed_v1", "true");
    } catch {
      /* storage unavailable: dismiss for this page view only */
    }
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="relative z-40 border-b border-line bg-sunk">
      <div className="page-wrap flex flex-wrap items-center justify-between gap-3 py-2.5 text-[13px] text-ink-2">
        <div className="flex items-center gap-3">
          <span className="badge-accent">Public beta</span>
          <span className="hidden sm:inline">Features are still changing. If something looks off, tell us.</span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/feedback" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-accent">
            Report a bug or suggest a feature
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="grid h-7 w-7 place-items-center rounded-sm text-muted transition-colors hover:bg-line hover:text-ink"
            aria-label="Dismiss notice"
            title="Dismiss notice"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
