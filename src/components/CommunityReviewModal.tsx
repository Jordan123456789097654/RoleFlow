"use client";

import React, { useState } from "react";
import { Star, MessageSquareQuote, CheckCircle2, AlertCircle } from "lucide-react";

interface ReviewModalProps {
  guildId: string;
  guildName: string;
  canReview: boolean;
  currentUser: {
    id: string;
    username: string;
  } | null;
  onReviewSubmitted?: () => void;
}

export function CommunityReviewModal({
  guildId,
  guildName,
  canReview,
  currentUser,
}: ReviewModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 3) {
      setError("Please write at least a short sentence (3+ characters).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/guilds/${guildId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit testimonial.");
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to post review");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <a
        href="/api/auth/login"
        className="rf-btn-ghost !px-3.5 !py-2 !text-[13px] inline-flex items-center gap-1.5"
      >
        <MessageSquareQuote className="w-3.5 h-3.5 text-violet-300" />
        <span>Log in to review</span>
      </a>
    );
  }

  if (!canReview) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rf-btn-primary !px-3.5 !py-2 !text-[13px] inline-flex items-center gap-1.5"
      >
        <MessageSquareQuote className="w-3.5 h-3.5" />
        <span>Leave a Testimonial</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface-card border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Community Testimonial</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Share your experience as an accepted member of {guildName}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {success ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-base font-semibold text-white">Testimonial Published!</h4>
                <p className="text-xs text-slate-400">Refreshing page to update reviews...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Rating (1 to 5 Stars)
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = (hoverRating || rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="p-1 focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              isFilled
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-600 hover:text-slate-500"
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="ml-2 text-xs font-medium text-amber-300">
                      {hoverRating || rating} / 5
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Your Review / Testimonial
                  </label>
                  <textarea
                    rows={4}
                    maxLength={500}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe how the application & onboarding process was, the team culture, and management style..."
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition resize-none"
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                    <span>Markdown supported</span>
                    <span>{comment.length} / 500</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rf-btn-ghost !px-3.5 !py-2 !text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !comment.trim()}
                    className="rf-btn-primary !px-4 !py-2 !text-xs disabled:opacity-50"
                  >
                    {loading ? "Posting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
