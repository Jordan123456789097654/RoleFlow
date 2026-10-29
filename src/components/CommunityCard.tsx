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
      className="card card-hover group flex flex-col overflow-hidden"
    >
      {/* Banner */}
      <div className="relative h-24 w-full overflow-hidden border-b border-line bg-sunk">
        {guild.banner ? (
          <img src={guild.banner} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent_0_14px,rgba(22,21,18,0.05)_14px_15px)]" />
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="-mt-10 mb-4 flex items-end justify-between gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-md border border-line-strong bg-surface">
            {guild.icon ? (
              <img src={guild.icon} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-[22px] text-ink">{guild.name.charAt(0)}</span>
            )}
          </div>
          <span
            className={cn(
              "badge",
              open > 0 ? "badge-moss" : "badge-neutral"
            )}
          >
            {open > 0 ? `${open} open` : "Closed"}
          </span>
        </div>

        <div className="min-w-0">
          <h3 className="truncate font-display text-[22px] leading-tight text-ink">{guild.name}</h3>
          {guild.category && <p className="mt-0.5 truncate text-[13px] text-muted">{guild.category}</p>}
        </div>

        {guild.description && (
          <p className="mt-3 line-clamp-2 flex-1 text-[14px] leading-relaxed text-ink-2">{guild.description}</p>
        )}

        {badgeList.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {badgeList.map((badge) => (
              <span key={badge} className="badge-accent">
                {BADGE_LABELS[badge] || badge.replace(/_/g, " ").toLowerCase()}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {tagList.slice(0, 2).map((tag) => (
              <span key={tag} className="chip">{tag}</span>
            ))}
            {typeof guild.rating === "number" && guild.rating > 0 && (
              <span className="inline-flex items-center gap-1 font-mono text-[12px] tabular-nums text-ink-2">
                <Star className="h-3 w-3 fill-gold text-gold" />
                {guild.rating.toFixed(1)}
                {typeof guild.reviewsCount === "number" && <span className="text-faint">({guild.reviewsCount})</span>}
              </span>
            )}
          </div>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-[13px] font-medium text-ink transition-colors group-hover:text-accent">
            View
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
