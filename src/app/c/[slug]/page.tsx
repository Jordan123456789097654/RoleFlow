import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { BadgeCheck, Users, Briefcase, ArrowLeft, ArrowRight, Star, MessageSquareQuote } from "lucide-react";
import ReportButton from "@/components/ReportButton";
import { CommunityReviewModal } from "@/components/CommunityReviewModal";

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
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              robloxUsername: true,
              robloxAvatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!guild) {
    notFound();
  }

  const currentUser = await getCurrentUser();

  // Check if current user has an accepted application in this guild
  let canReview = false;
  if (currentUser) {
    const acceptedApp = await prisma.application.findFirst({
      where: {
        userId: currentUser.id,
        status: "ACCEPTED",
        position: {
          guildId: guild.id,
        },
      },
      select: { id: true },
    });
    canReview = Boolean(acceptedApp);
  }

  // Calculate review stats
  const totalReviews = guild.reviews.length;
  const avgRating =
    totalReviews > 0
      ? Number((guild.reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
      : 0;

  const tags = guild.tags ? guild.tags.split(",").map((t) => t.trim()) : [];

  const themePresets: Record<string, { bannerGradient: string; borderGlow: string; accentClass: string }> = {
    obsidian: {
      bannerGradient: "from-violet-950 via-purple-900/60 to-slate-900",
      borderGlow: "border-purple-500/20",
      accentClass: "bg-purple-600 hover:bg-purple-500 shadow-purple-600/30",
    },
    cyberpunk: {
      bannerGradient: "from-cyan-950 via-fuchsia-900/60 to-yellow-950/40",
      borderGlow: "border-cyan-500/30",
      accentClass: "bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/40",
    },
    emerald: {
      bannerGradient: "from-emerald-950 via-teal-900/60 to-slate-900",
      borderGlow: "border-emerald-500/20",
      accentClass: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30",
    },
    royal: {
      bannerGradient: "from-indigo-950 via-purple-900/60 to-slate-900",
      borderGlow: "border-indigo-500/20",
      accentClass: "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30",
    },
    crimson: {
      bannerGradient: "from-rose-950 via-red-900/60 to-slate-900",
      borderGlow: "border-rose-500/20",
      accentClass: "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30",
    },
  };
  const currentTheme = themePresets[guild.portalTheme || "obsidian"] || themePresets.obsidian;
  const accent = (guild as any).accentColor || "#8b5cf6";
  const layout = (guild as any).portalLayout || "list";

  const badges = guild.verifiedBadges
    ? guild.verifiedBadges.split(",").map((b) => b.trim()).filter(Boolean)
    : guild.isVerified
    ? [guild.verifiedBadge || "VERIFIED"]
    : [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
      <Link
        href="/browse"
        className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to browse
      </Link>

      {/* Community Banner & Header Profile */}
      <div className={`rounded-3xl overflow-hidden glass-panel border ${currentTheme.borderGlow} mb-12`}>
        <div className="h-1 w-full" style={{ background: accent }} />
        {/* Banner */}
        <div className={`relative h-44 sm:h-56 w-full bg-gradient-to-r ${currentTheme.bannerGradient} overflow-hidden`}>
          {guild.banner ? (
            <img src={guild.banner} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-radial-glow" />
          )}
        </div>

        {/* Profile Info Row */}
        <div className="p-6 sm:p-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-surface-card ring-4 ring-surface-card overflow-hidden shadow-xl shrink-0">
                {guild.icon ? (
                  <img src={guild.icon} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center font-display font-bold text-3xl text-white">
                    {guild.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">{guild.name}</h1>
                  {badges.map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-200 border border-violet-400/30 text-[10px] font-bold"
                    >
                      <BadgeCheck className="w-3 h-3 text-purple-400 fill-purple-400/20" />
                      {b.replace("_", " ")}
                    </span>
                  ))}
                  {guild.category && (
                    <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[11px] font-medium">
                      {guild.category}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span className="text-emerald-300 font-medium">
                    {guild.positions.length} open position{guild.positions.length === 1 ? "" : "s"}
                  </span>
                  {totalReviews > 0 && (
                    <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {avgRating} ({totalReviews} review{totalReviews === 1 ? "" : "s"})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Community Stats / Manage */}
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/${guild.id}`}
                className="rf-btn-ghost !px-3.5 !py-2 !text-[13px]"
              >
                Staff Portal
              </Link>
              <ReportButton targetType="GUILD" targetId={guild.id} />
            </div>
          </div>

          {guild.description && (
            <p className="text-[15px] text-slate-300 max-w-3xl leading-relaxed mt-4">
              {guild.description}
            </p>
          )}

          {(guild.welcomeMessage || guild.websiteUrl || guild.discordInviteUrl) && (
            <div className="mt-4 space-y-3">
              {guild.welcomeMessage && (
                <p className="text-sm text-slate-200 whitespace-pre-wrap rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">{guild.welcomeMessage}</p>
              )}
              <div className="flex flex-wrap gap-3 text-xs">
                {guild.websiteUrl && <a href={guild.websiteUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-purple-300 hover:text-white">Website</a>}
                {guild.discordInviteUrl && <a href={guild.discordInviteUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-purple-300 hover:text-white">Join our Discord</a>}
              </div>
            </div>
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
      <div className="mb-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-violet-300" />
            Open positions
          </h2>
        </div>

        {guild.positions.length === 0 ? (
          <div className="rf-card text-center py-14">
            <p className="text-sm text-slate-400">There are no active openings for this community right now.</p>
          </div>
        ) : (
          <div className={layout === "cards" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
            {guild.positions.map((pos) => (
              <div
                key={pos.id}
                className="glass-panel glass-panel-hover rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[17px] font-semibold text-white">{pos.title}</h3>
                    {pos.department && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-500/15 text-violet-200 border border-violet-400/30">
                        {pos.department}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-slate-400 leading-relaxed line-clamp-2">
                    {pos.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <ReportButton targetType="POSITION" targetId={pos.id} />
                  <span className="text-xs text-slate-500 hidden sm:block">
                    {guild.showApplicantCount && `${pos._count.applications} submitted`}
                  </span>

                  <Link
                    href={`/apply/${pos.id}`}
                    className="rf-btn-primary !px-4 !py-2.5 !text-[13px]"
                  >
                    <span>Apply</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Community Reviews & Testimonials Section */}
      <div className="mb-14">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageSquareQuote className="w-4 h-4 text-violet-300" />
              Member Testimonials &amp; Reviews
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Genuine reviews written by applicants accepted into {guild.name}.
            </p>
          </div>

          <CommunityReviewModal
            guildId={guild.id}
            guildName={guild.name}
            canReview={canReview}
            currentUser={
              currentUser ? { id: currentUser.id, username: currentUser.username } : null
            }
          />
        </div>

        {totalReviews === 0 ? (
          <div className="rf-card text-center py-12 px-6">
            <Star className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-white">No testimonials yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Accepted applicants can submit feedback and share their experience joining this community.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Rating Banner */}
            <div className="glass-panel rounded-2xl p-4 sm:p-5 flex items-center justify-between flex-wrap gap-4 border border-violet-500/20 bg-gradient-to-r from-violet-950/30 to-surface-card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 grid place-items-center text-amber-300 font-bold text-xl">
                  {avgRating}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= Math.round(avgRating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Based on {totalReviews} verified applicant review{totalReviews === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-400 font-medium">
                Verified member feedback
              </div>
            </div>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guild.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="glass-panel rounded-2xl p-5 flex flex-col justify-between border border-white/[0.08]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-card border border-white/10 shrink-0">
                          {rev.user.avatar ? (
                            <img src={rev.user.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-violet-600 grid place-items-center text-[10px] font-bold text-white">
                              {rev.user.username.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">
                            {rev.user.username}
                          </div>
                          {rev.user.robloxUsername && (
                            <div className="text-[10px] text-slate-400">
                              @{rev.user.robloxUsername}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-600"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed italic whitespace-pre-wrap">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-white/[0.06] text-[10px] text-slate-500">
                    Verified Accepted Member • {new Date(rev.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Discord Widget Embed */}
      {guild.discordWidgetEnabled && /^\d{17,20}$/.test(guild.id) && (
        <div className="mt-8 rounded-2xl overflow-hidden glass-panel p-5">
          <h3 className="rf-eyebrow mb-3 flex items-center gap-2">
            <Users className="w-3.5 h-3.5" />
            Live Discord Community
          </h3>
          <iframe
            src={`https://discord.com/widget?id=${guild.id}&theme=dark`}
            width="100%"
            height="350"
            allowTransparency={true}
            frameBorder="0"
            sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
            className="rounded-xl w-full"
          />
        </div>
      )}
    </div>
  );
}
