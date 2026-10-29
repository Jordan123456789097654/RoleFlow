"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Level = "info" | "success" | "warn" | "error";
type Line = { id: string; level: Level; message: string; at: string };

const TAG: Record<Level, { tag: string; cls: string }> = {
  info: { tag: "[i]", cls: "text-sky-300" },
  success: { tag: "[✓]", cls: "text-emerald-300" },
  warn: { tag: "[!]", cls: "text-amber-300" },
  error: { tag: "[✗]", cls: "text-red-400" },
};

const POLL_MS = 3000;
const KEEP = 500;

/** A live, read-only console for the community's bot. Polls for new lines with a cursor. */
export default function BotConsole({ guildId }: { guildId: string }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [paused, setPaused] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [issuesOnly, setIssuesOnly] = useState(false);

  const cursor = useRef<string | null>(null);
  const seen = useRef(new Set<string>());
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const boxRef = useRef<HTMLDivElement>(null);

  const pull = useCallback(
    async (initial: boolean) => {
      const q = !initial && cursor.current ? `?after=${encodeURIComponent(cursor.current)}` : "";
      try {
        const res = await fetch(`/api/guilds/${guildId}/bot/logs${q}`, { cache: "no-store" });
        if (!res.ok) {
          setConnected(false);
          return;
        }
        const data: { lines: Line[]; cursor: string | null } = await res.json();
        const fresh = data.lines.filter((l) => !seen.current.has(l.id));
        fresh.forEach((l) => seen.current.add(l.id));
        if (fresh.length) setLines((prev) => [...prev, ...fresh].slice(-KEEP));
        if (data.cursor) cursor.current = data.cursor;
        setConnected(true);
      } catch {
        setConnected(false);
      }
    },
    [guildId]
  );

  useEffect(() => {
    pull(true);
    const t = setInterval(() => {
      if (!pausedRef.current) pull(false);
    }, POLL_MS);
    return () => clearInterval(t);
  }, [pull]);

  const shown = useMemo(
    () => (issuesOnly ? lines.filter((l) => l.level === "warn" || l.level === "error") : lines),
    [lines, issuesOnly]
  );

  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown.length]);

  const dot = connected === true ? "bg-emerald-400" : connected === false ? "bg-red-400" : "bg-zinc-500";
  const status = connected === true ? (paused ? "paused" : "live") : connected === false ? "connection lost, retrying" : "connecting";

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-[#0b0d12] shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-2 font-mono text-[12px] text-zinc-300">
          <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
          Bot console · {status}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-400">
            <input type="checkbox" checked={issuesOnly} onChange={(e) => setIssuesOnly(e.target.checked)} className="accent-emerald-400" />
            warnings & errors
          </label>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="rounded-md border border-white/15 px-2.5 py-1 font-mono text-[11px] text-zinc-200 hover:bg-white/10"
          >
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={() => setLines([])}
            className="rounded-md border border-white/15 px-2.5 py-1 font-mono text-[11px] text-zinc-200 hover:bg-white/10"
          >
            Clear
          </button>
        </div>
      </div>

      <div ref={boxRef} className="h-96 overflow-y-auto px-4 py-3 font-mono text-[12px] leading-5" role="log" aria-live="polite">
        <p className="text-sky-300">[i] Establishing console session…</p>
        {connected === true && <p className="text-emerald-300">[✓] Console connected</p>}
        {connected === false && <p className="text-red-400">[✗] Could not reach the console. Retrying every few seconds.</p>}
        {shown.length === 0 && connected === true && (
          <p className="text-zinc-500">[i] No output yet. Lines appear here once the bot connects.</p>
        )}
        {shown.map((l) => (
          <div key={l.id} className="whitespace-pre-wrap break-words">
            <span className="text-zinc-500">{new Date(l.at).toLocaleTimeString("en-US", { hour12: false })}</span>{" "}
            <span className={TAG[l.level].cls}>{TAG[l.level].tag}</span>{" "}
            <span className="text-zinc-200">{l.message}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
