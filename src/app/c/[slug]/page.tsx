import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BadgeCheck, Users, Briefcase, ArrowLeft, ArrowRight, Shield, ExternalLink } from "lucide-react";

export const revalidate = 0;

interface CommunityPortalProps {
  params: {
    slug: string;
  };
}

export default async function CommunityPortalPage({ params }: CommunityPortalProps) {
  // Query by vanitySlug OR by ID
  const guild = await prisma.guild.findFirst({
    where: {
      OR: [{ vanitySlug: params.slug }, { id: params.slug }],
    },
    include: {
      positions: {
        where: { isOpen: true },
        include: {
          _count: { select: { applications: true } },
        },
      },
    },
  });

  if (!guild) {
    notFound();
  }

  const tags = guild.tags ? guild.tags.split(",").map((t) => t.trim()) : [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/browse"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Directory
      </Link>

      {/* Community Banner & Header Profile */}
      <div className="rounded-3xl overflow-hidden glass-panel border border-white/10 mb-10 shadow-2xl">
        {/* Banner */}
        <div className="relative h-44 sm:h-56 w-full bg-gradient-to-r from-violet-950 via-purple-900/60 to-slate-900 overflow-hidden">
          {guild.banner ? (
            <img src={guild.banner} alt={guild.name} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-radial-glow" />
          )}
        </div>

        {/* Profile Info Row */}
        <div className="p-6 sm:p-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-surface-card border-4 border-background overflow-hidden shadow-2xl shrink-0">
                {guild.icon ? (
                  <img src={guild.icon} alt={guild.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-violet-600 flex items-center justify-center font-bold text-2xl text-white">
                    {guild.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white">{guild.name}</h1>
                  {guild.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                      <BadgeCheck className="w-3 h-3 text-purple-400 fill-purple-400/20" />
                      {guild.verifiedBadge || "VERIFIED"}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  {guild.memberCount ? (
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      {guild.memberCount.toLocaleString()} members
                    </span>
                  ) : null}
                  <span>•</span>
                  <span className="text-purple-400 font-medium">
                    {guild.positions.length} open position{guild.positions.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Community Stats / Manage */}
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/${guild.id}`}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-colors"
              >
                Staff Portal
              </Link>
            </div>
          </div>

          {guild.description && (
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed mt-4">
              {guild.description}
            </p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 text-slate-300 border border-white/5"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Available Openings Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-purple-400" />
            Active Openings & Applications
          </h2>
        </div>

        {guild.positions.length === 0 ? (
          <div className="text-center py-12 border border-white/5 rounded-2xl bg-surface/30">
            <p className="text-xs text-slate-400">There are no active openings for this community right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {guild.positions.map((pos) => (
              <div
                key={pos.id}
                className="glass-panel glass-panel-hover rounded-2xl p-6 border border-white/5 hover:border-purple-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{pos.title}</h3>
                    {pos.department && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {pos.department}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {pos.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs text-slate-500 hidden sm:block">
                    {pos._count.applications} submitted
                  </span>

                  <Link
                    href={`/apply/${pos.id}`}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-violet-600/30"
                  >
                    <span>Apply for Role</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
