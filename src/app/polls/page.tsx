"use client";

import { useEffect, useState } from "react";

type Option = { id: string; label: string; votes: number | null };
type Poll = {
  id: string;
  question: string;
  description: string | null;
  open: boolean;
  closesAt: string | null;
  allowOther: boolean;
  otherLabel: string;
  totalVotes: number;
  options: Option[];
  otherVotes: number | null;
  myVote: { optionId: string | null; otherText: string | null } | null;
  signedIn: boolean;
};

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[] | null>(null);
  const load = () => fetch("/api/polls").then((r) => r.json()).then((d) => setPolls(d.polls ?? []));
  useEffect(() => { load(); }, []);

  return (
    <div className="page-wrap py-12 sm:py-16 space-y-8 max-w-3xl">
      <div>
        <p className="eyebrow mb-3">Community polls</p>
        <h1 className="display-md">Help decide what comes next</h1>
        <p className="mt-3 text-sm text-muted">Vote once per poll. You can change your vote until the poll closes.</p>
      </div>
      {polls === null && <p className="text-sm text-muted">Loading polls...</p>}
      {polls?.length === 0 && <p className="text-sm text-muted">No polls right now. Check back soon.</p>}
      {polls?.map((p) => <PollCard key={p.id} poll={p} onVoted={load} />)}
    </div>
  );
}

function PollCard({ poll, onVoted }: { poll: Poll; onVoted: () => void }) {
  const [choice, setChoice] = useState<string | null>(poll.myVote?.optionId ?? (poll.myVote?.otherText ? "__other" : null));
  const [otherText, setOtherText] = useState(poll.myVote?.otherText ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showResults = poll.options.some((o) => o.votes !== null);
  const total = poll.totalVotes || 0;

  const vote = async () => {
    setError(null);
    if (!choice) return setError("Choose an option first.");
    if (choice === "__other" && !otherText.trim()) return setError("Write your answer first.");
    setBusy(true);
    const res = await fetch(`/api/polls/${poll.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(choice === "__other" ? { otherText } : { optionId: choice }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(d.error || "Could not save your vote.");
    onVoted();
  };

  return (
    <section className="glass-panel rounded-2xl border border-line p-6 space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-ink">{poll.question}</h2>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${poll.open ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "bg-sunk text-muted border-line"}`}>
            {poll.open ? "OPEN" : "CLOSED"}
          </span>
        </div>
        {poll.description && <p className="mt-2 text-sm text-muted whitespace-pre-line">{poll.description}</p>}
        {poll.open && poll.closesAt && <p className="mt-1 text-xs text-faint">Closes {new Date(poll.closesAt).toLocaleString()}</p>}
      </div>

      <div className="space-y-2">
        {poll.options.map((o) => {
          const pct = showResults && total ? Math.round(((o.votes ?? 0) / total) * 100) : 0;
          return (
            <label key={o.id} className={`relative block overflow-hidden rounded-xl border border-line px-4 py-3 text-sm ${poll.open ? "cursor-pointer hover:bg-sunk" : ""}`}>
              {showResults && <span className="absolute inset-y-0 left-0 bg-purple-500/15" style={{ width: `${pct}%` }} />}
              <span className="relative flex items-center gap-3">
                {poll.open && (
                  <input type="radio" name={poll.id} checked={choice === o.id} onChange={() => setChoice(o.id)} disabled={!poll.signedIn} />
                )}
                <span className="flex-1 text-ink">{o.label}</span>
                {showResults && <span className="text-xs text-muted">{o.votes} ({pct}%)</span>}
              </span>
            </label>
          );
        })}

        {poll.allowOther && (
          <div className="rounded-xl border border-line px-4 py-3 space-y-2">
            <label className="flex items-center gap-3 text-sm text-ink">
              {poll.open && <input type="radio" name={poll.id} checked={choice === "__other"} onChange={() => setChoice("__other")} disabled={!poll.signedIn} />}
              <span>{poll.otherLabel}</span>
              {showResults && poll.otherVotes !== null && <span className="ml-auto text-xs text-muted">{poll.otherVotes} written answers</span>}
            </label>
            {poll.open && choice === "__other" && (
              <input
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                maxLength={300}
                placeholder="Tell us in your own words"
                className="w-full rounded-lg border border-line bg-sunk px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              />
            )}
          </div>
        )}
      </div>

      {showResults && <p className="text-xs text-faint">{total} {total === 1 ? "vote" : "votes"} so far.</p>}

      {poll.open && !poll.signedIn && (
        <a href="/login" className="inline-block rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500">Sign in with Discord to vote</a>
      )}
      {poll.open && poll.signedIn && (
        <div className="flex items-center gap-3">
          <button onClick={vote} disabled={busy} className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-40">
            {busy ? "Saving..." : poll.myVote ? "Change my vote" : "Vote"}
          </button>
          {poll.myVote && <span className="text-xs text-emerald-500">Your vote is saved.</span>}
        </div>
      )}
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </section>
  );
}
