"use client";

import React, { useState, useEffect } from "react";
import { ThumbsUp, Sparkles, Plus, Clock, CheckCircle, Flame, Filter } from "lucide-react";

interface Idea {
  id: string;
  title: string;
  description: string;
  authorName: string | null;
  category: string;
  status: "UNDER_REVIEW" | "PLANNED" | "IN_PROGRESS" | "SHIPPED";
  upvotes: number;
  hasVoted: boolean;
}

export function CommunityIdeasBoard() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchIdeas = async () => {
    try {
      const res = await fetch("/api/parent/ideas");
      if (res.ok) {
        const data = await res.json();
        setIdeas(data.ideas || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  const handleVote = async (ideaId: string) => {
    // Optimistic UI update
    setIdeas((prev) =>
      prev.map((i) => {
        if (i.id === ideaId) {
          const delta = i.hasVoted ? -1 : 1;
          return { ...i, upvotes: Math.max(1, i.upvotes + delta), hasVoted: !i.hasVoted };
        }
        return i;
      })
    );

    try {
      const res = await fetch("/api/parent/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upvote", ideaId }),
      });
      if (res.ok) {
        const data = await res.json();
        setIdeas((prev) =>
          prev.map((i) => (i.id === ideaId ? { ...i, upvotes: data.upvotes, hasVoted: data.hasVoted } : i))
        );
      }
    } catch {
      fetchIdeas();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setSubmitting(true);
    setMsg(null);

    try {
      const res = await fetch("/api/parent/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", title, description, category, authorName }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setTitle("");
        setDescription("");
        setAuthorName("");
        fetchIdeas();
      } else {
        setMsg(data.error || "Failed to submit.");
      }
    } catch {
      setMsg("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = filterCategory === "ALL" ? ideas : ideas.filter((i) => i.category === filterCategory);

  const getStatusBadge = (status: Idea["status"]) => {
    switch (status) {
      case "SHIPPED":
        return <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">Shipped</span>;
      case "IN_PROGRESS":
        return <span className="rounded-full border border-violet-500/40 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-300">In Development</span>;
      case "PLANNED":
        return <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">Planned for Q4</span>;
      default:
        return <span className="rounded-full border border-white/20 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Under Review</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Controls Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "ROBLOX", "DISCORD", "AUTOMATION", "GENERAL"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filterCategory === cat
                  ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {cat === "ALL" ? "All Features" : cat}
            </button>
          ))}
        </div>

        {/* Submit Idea CTA */}
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-violet-500 hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" /> Propose a Tool or Feature
        </button>
      </div>

      {/* Ideas Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-slate-400">
          Loading community feature requests...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center text-slate-400">
          No proposals found in this category. Be the first to suggest one!
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md transition-all hover:border-violet-500/40 hover:bg-white/[0.05]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  {getStatusBadge(item.status)}
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    {item.category}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="text-xs leading-relaxed text-slate-300">{item.description}</p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-[11px] text-slate-400">
                  By {item.authorName || "Community Staff"}
                </span>

                <button
                  type="button"
                  onClick={() => handleVote(item.id)}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                    item.hasVoted
                      ? "border border-violet-500 bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                      : "border border-white/15 bg-white/5 text-slate-300 hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-white"
                  }`}
                >
                  <ThumbsUp className={`h-3.5 w-3.5 ${item.hasVoted ? "fill-white" : ""}`} />
                  <span>{item.upvotes}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggest Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#0e0f17] p-8 shadow-2xl space-y-4 text-left"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-400" />
              <h3 className="text-lg font-bold text-white">Propose a Feature or Tool</h3>
            </div>
            <p className="text-xs text-slate-300">
              Community suggestions directly guide what we develop next in the RoleFlow family.
            </p>

            {msg && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 font-medium">
                {msg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">Feature Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Automated Roblox Rank Synchronization"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#161722] px-3.5 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
                >
                  <option value="GENERAL">General</option>
                  <option value="ROBLOX">Roblox</option>
                  <option value="DISCORD">Discord</option>
                  <option value="AUTOMATION">Automation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">Your Name / Handle</label>
                <input
                  type="text"
                  placeholder="e.g. DevJordan (optional)"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">What problem does this solve?</label>
              <textarea
                required
                rows={4}
                placeholder="Explain the workflow challenge and how this feature saves community staff time..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-violet-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-violet-500 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Proposal"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
