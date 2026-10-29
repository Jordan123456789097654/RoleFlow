"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface ChangelogData {
  id: string;
  version: string;
  title: string;
  content: string;
  tag: string;
  publishedAt: string;
}

const SEEN_KEY = "roleflow_seen_changelog_id";

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
            let seenId: string | null = null;
            try {
              seenId = localStorage.getItem(SEEN_KEY);
            } catch {
              /* storage unavailable: treat as unseen */
            }
            if (seenId !== data.latest.id) {
              setChangelog(data.latest);
              setIsOpen(true);
            }
          }
        }
      } catch {
        // Silent fail
      }
    }

    checkLatestChangelog();
  }, []);

  const handleDismiss = () => {
    if (changelog) {
      try {
        localStorage.setItem(SEEN_KEY, changelog.id);
      } catch {
        /* ignore */
      }
    }
    setIsOpen(false);
  };

  if (!isOpen || !changelog) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 animate-in">
      <div role="dialog" aria-modal="true" aria-labelledby="changelog-title" className="w-full max-w-lg rounded-lg border border-line-strong bg-surface p-6 shadow-pop sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="font-mono text-[12px] text-muted">{changelog.version}</span>
              <span className="badge-accent">{changelog.tag}</span>
            </div>
            <h2 id="changelog-title" className="display-md">{changelog.title}</h2>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-sm text-muted transition-colors hover:bg-sunk hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 max-h-72 overflow-y-auto border-y border-line py-5">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink-2">{changelog.content}</p>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono text-[12px] text-faint">
            Published {new Date(changelog.publishedAt).toLocaleDateString()}
          </span>
          <button type="button" onClick={handleDismiss} className="btn-primary">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
