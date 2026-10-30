"use client";

import React, { useState } from "react";
import { Star, AlertCircle, CheckCircle2 } from "lucide-react";

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
      <a href="/login" className="btn-ghost">
        Log in to review
      </a>
    );
  }

  if (!canReview) {
    return null;
  }

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className="btn-primary">
        Leave a review
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 animate-in">
          <div role="dialog" aria-modal="true" aria-labelledby="review-title" className="relative w-full max-w-md rounded-lg border border-line-strong bg-surface p-6 shadow-pop sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 id="review-title" className="display-md text-[24px]">Leave a review</h3>
                <p className="mt-1.5 text-[14px] text-muted">
                  Share your experience as an accepted member of {guildName}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-sm text-muted hover:bg-sunk hover:text-ink"
              >
                ✕
              </button>
            </div>

            {success ? (
              <div className="space-y-2 py-8 text-center">
                <CheckCircle2 className="mx-auto h-9 w-9 text-moss" />
                <h4 className="display-md text-[22px]">Review published</h4>
                <p className="text-[14px] text-muted">Refreshing to show your review…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div role="alert" className="flex items-center gap-2 rounded-md border border-danger bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <fieldset>
                  <legend className="label">Rating</legend>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = (hoverRating || rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          aria-label={`${star} star${star === 1 ? "" : "s"}`}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="grid h-10 w-9 place-items-center"
                        >
                          <Star className={`h-6 w-6 ${isFilled ? "fill-gold text-gold" : "text-line-strong"}`} />
                        </button>
                      );
                    })}
                    <span className="ml-3 font-mono text-[13px] tabular-nums text-ink-2">
                      {hoverRating || rating} / 5
                    </span>
                  </div>
                </fieldset>

                <div>
                  <label htmlFor="review-comment" className="label">Your review</label>
                  <textarea
                    id="review-comment"
                    rows={4}
                    maxLength={500}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="How was the application and onboarding? What is the team like?"
                    className="field resize-none"
                  />
                  <div className="mt-1.5 flex items-center justify-between font-mono text-[12px] text-faint tabular-nums">
                    <span>Plain text</span>
                    <span>{comment.length} / 500</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-line pt-5">
                  <button type="button" onClick={() => setIsOpen(false)} className="btn-ghost">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading || !comment.trim()} className="btn-primary">
                    {loading ? "Posting…" : "Publish review"}
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
