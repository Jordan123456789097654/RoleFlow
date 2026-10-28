import React from "react";
import Link from "next/link";
import { BadgeCheck, Users, Briefcase, ChevronRight } from "lucide-react";
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
    memberCount?: number;
    tags?: string | null;
    positionsCount?: number;
    description?: string | null;
  };
}

export function CommunityCard({ guild }: CommunityCardProps) {
  const targetUrl = guild.vanitySlug ? `/c/${guild.vanitySlug}` : `/c/${guild.id}`;
  const tagList = guild.tags ? guild.tags.split(",").map((t) => t.trim()) : [];

  return (
    <Link
      href={targetUrl}
      className="group relative flex flex-col rounded-2xl overflow-hidden glass-panel glass-panel-hover border border-white/5 hover:border-purple-500/40 transition-all duration-300"
    >
      {/* Banner / Graphic Area */}
      <div className="relative h-28 w-full overflow-hidden bg-gradient-to-r from-violet-950 via-purple-900/40 to-slate-900">
        {guild.banner ? (
          <img
            src={guild.banner}
            alt={guild.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-800/20 via-slate-950/60 to-black" />
        )}

        {/* Floating Openings Badge */}
        <div className="absolute top-2.5 right-2.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-purple-300 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {guild.positionsCount || 0} open
          </span>
        </div>
      </div>

      {/* Community Details */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-3 -mt-7 mb-2.5 relative z-10">
          <div className="w-11 h-11 rounded-xl bg-surface-card border-2 border-background overflow-hidden shadow-lg flex items-center justify-center shrink-0">
            {guild.icon ? (
              <img src={guild.icon} alt={guild.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-sm bg-gradient-to-tr from-violet-600 to-purple-400 w-full h-full flex items-center justify-center">
                {guild.name.charAt(0)}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-3">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                {guild.name}
              </h3>
              {guild.isVerified && (
                <div title={`Verified Community (${guild.verifiedBadge || "OFFICIAL"})`}>
                  <BadgeCheck className="w-4 h-4 text-purple-400 shrink-0 fill-purple-400/20" />
                </div>
              )}
            </div>

            {guild.memberCount ? (
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {guild.memberCount.toLocaleString()} members
              </span>
            ) : null}
          </div>
        </div>

        {guild.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed flex-1">
            {guild.description}
          </p>
        )}

        {/* Tags */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {tagList.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-300 border border-white/5"
              >
                {tag}
              </span>
            ))}
          </div>

          <span className="text-xs text-purple-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform font-medium">
            View
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
