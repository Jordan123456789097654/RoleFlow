import React from "react";
import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommunityCardProps {
  guild: {
    id: string;
    name: string;
    icon?: string | null;
    banner?: string | null;
    vanitySlug?: string | null;
    isVerified?: boolean;
    verifiedBadge?: string | null;
    verifiedBadges?: string | null;
    memberCount?: number;
    tags?: string | null;
    category?: string | null;
    positionsCount?: number;
    description?: string | null;
    rating?: number | null;
    reviewsCount?: number;
  };
}

const BADGE_LABELS: Record<string, string> = {
  PARTNER: "Partner",
  TOP_STUDIO: "Top studio",
  COMMUNITY_FAVORITE: "Favourite",
  EARLY_ADOPTER: "Early adopter",
  OFFICIAL: "Official",
};

export function CommunityCard({ guild }: CommunityCardProps) {
  const targetUrl = guild.vanitySlug ? `/c/${guild.vanitySlug}` : `/c/${guild.id}`;
  const tagList = guild.tags ? guild.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const badgeList = guild.verifiedBadges
    ? guild.verifiedBadges.split(",").filter(Boolean)
    : guild.verifiedBadge
    ? [guild.verifiedBadge]
    : guild.isVerified
    ? ["OFFICIAL"]
    : [];
  const open = guild.positionsCount || 0;

  return (
    <Link
      href={targetUrl}
      className="card card-hover group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-card hover:border-accent/40"
    >
      {/* Banner */}
      <div className="relative h-28 w-full overflow-hidden border-b border-line bg-sunk/60">
        {guild.banner ? (
          <img
            src={guild.banner}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-surface via-sunk to-surface/80 flex items-center justify-center">
            <span className="font-mono text-xs uppercase tracking-wider text-muted/60">{guild.category || "Community"}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="-mt-11 mb-3 flex items-end justify-between gap-3">
          <div className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-surface bg-surface shadow-md">
            {guild.icon ? (
              <img src={guild.icon} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-[22px] font-bold text-ink">{guild.name.charAt(0)}</span>
            )}
          </div>
          <span
            className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border shadow-sm",
              open > 0
                ? "bg-moss/10 text-moss border-moss/30"
                : "bg-muted/10 text-muted border-line"
            )}
          >
            {open > 0 ? `${open} open` : "Closed"}
          </span>
        </div>

        <div className="min-w-0">
          <h3 className="truncate font-display text-[20px] font-semibold leading-tight text-ink group-hover:text-accent transition-colors">
            {guild.name}
          </h3>
          {guild.category && (
            <p className="mt-0.5 truncate text-[12px] font-medium uppercase tracking-wider text-muted">
              {guild.category}
            </p>
          )}
        </div>

        {guild.description && (
          <p className="mt-2.5 line-clamp-2 flex-1 text-[13px] leading-relaxed text-ink-2">
            {guild.description}
          </p>
        )}

        {badgeList.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {badgeList.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-accent/10 text-accent border border-accent/20"
              >
                {BADGE_LABELS[badge] || badge.replace(/_/g, " ").toLowerCase()}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line/60 pt-3.5">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {tagList.slice(0, 2).map((tag) => (
              <span key={tag} className="chip text-[11px]">{tag}</span>
            ))}
            {typeof guild.rating === "number" && guild.rating > 0 && (
              <span className="inline-flex items-center gap-1 font-mono text-[12px] tabular-nums text-ink-2">
                <Star className="h-3 w-3 fill-gold text-gold" />
                {guild.rating.toFixed(1)}
                {typeof guild.reviewsCount === "number" && <span className="text-faint text-[11px]">({guild.reviewsCount})</span>}
              </span>
            )}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-ink transition-colors group-hover:text-accent">
            View
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
