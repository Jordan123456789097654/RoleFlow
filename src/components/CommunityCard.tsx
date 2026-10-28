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

const BADGE_STYLES: Record<string, string> = {
  PARTNER: "bg-violet-500/15 text-violet-200 border-violet-400/30",
  TOP_STUDIO: "bg-amber-500/15 text-amber-200 border-amber-400/30",
  COMMUNITY_FAVORITE: "bg-rose-500/15 text-rose-200 border-rose-400/30",
  EARLY_ADOPTER: "bg-cyan-500/15 text-cyan-200 border-cyan-400/30",
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
      className="group relative flex flex-col rounded-2xl overflow-hidden glass-panel glass-panel-hover"
    >
      {/* Banner */}
      <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-violet-900/50 via-surface-card to-surface">
        {guild.banner ? (
          <img src={guild.banner} alt="" className="w-full h-full object-cover opacity-90 group-hover:scale-[1.04] transition-transform duration-700" />
        ) : (
          <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_30%_20%,rgba(127,102,255,0.35),transparent_55%)]" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface-card/90 to-transparent" />

        <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-slate-100">
          <span className={cn("w-1.5 h-1.5 rounded-full", open > 0 ? "bg-emerald-400" : "bg-slate-500")} />
          {open} open
        </span>
      </div>

      <div className="px-4 pb-4 flex flex-col flex-1">
        <div className="flex items-end gap-3 -mt-6 mb-3 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-surface-card ring-2 ring-surface-card overflow-hidden shadow-lg shrink-0 grid place-items-center border border-white/10">
            {guild.icon ? (
              <img src={guild.icon} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full grid place-items-center text-white font-display font-bold bg-gradient-to-br from-violet-500 to-violet-700">
                {guild.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-0 pb-0.5 flex-1">
            <h3 className="text-[15px] font-semibold text-white truncate group-hover:text-violet-200 transition-colors">{guild.name}</h3>
            {guild.category && (
              <p className="text-[11px] text-violet-300 truncate">{guild.category}</p>
            )}
          </div>
          {typeof guild.rating === "number" && guild.rating > 0 ? (
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md text-[11px] font-semibold text-amber-300 shrink-0">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{guild.rating.toFixed(1)}</span>
              {typeof guild.reviewsCount === "number" && (
                <span className="text-[10px] text-amber-300/70">({guild.reviewsCount})</span>
              )}
            </div>
          ) : null}
        </div>

        {badgeList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {badgeList.map((badge) => (
              <span
                key={badge}
                className={cn(
                  "px-1.5 h-5 inline-flex items-center rounded text-[9px] font-mono font-bold border tracking-wide",
                  BADGE_STYLES[badge] || "bg-sky-500/15 text-sky-200 border-sky-400/30"
                )}
              >
                {badge.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}

        {guild.description && (
          <p className="text-[13px] text-slate-400 line-clamp-2 leading-relaxed mb-4 flex-1">{guild.description}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {tagList.slice(0, 2).map((tag) => (
              <span key={tag} className="px-2 h-5 inline-flex items-center rounded-md text-[10px] font-medium bg-white/[0.05] text-slate-300 border border-white/[0.06]">
                {tag}
              </span>
            ))}
          </div>
          <span className="text-[12px] text-violet-300 inline-flex items-center gap-0.5 font-medium shrink-0 group-hover:text-white transition-colors">
            View
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
