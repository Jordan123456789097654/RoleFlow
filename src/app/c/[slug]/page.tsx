import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { BadgeCheck, Users, ArrowLeft, ArrowRight, Star } from "lucide-react";
import ReportButton from "@/components/ReportButton";
import { CommunityReviewModal } from "@/components/CommunityReviewModal";
import { openNowWhere } from "@/lib/position-availability";
import { SaveOpeningButton } from "@/components/SaveOpeningButton";
import { getGuildResponseTime } from "@/lib/response-time";
import { readSiteConfig } from "@/lib/site-config";

export const revalidate = 0;

interface CommunityPortalProps {
  params: {
    slug: string;
  };
  /** True when rendered on a community's own domain, where RoleFlow's other pages are not reachable. */
  embedded?: boolean;
}

import type { Metadata } from "next";
import { platformOrigin } from "@/lib/platform-origin";

const SITE_URL = platformOrigin();

/** Only absolute https images can be used in link previews; inline data URLs are skipped. */
function previewImage(src: string | null | undefined): string | undefined {
  return src && src.startsWith("https://") ? src : undefined;
}

export async function generateMetadata({ params }: CommunityPortalProps): Promise<Metadata> {
  const guild = await prisma.guild.findFirst({
    where: { OR: [{ vanitySlug: params.slug }, { id: params.slug }] },
    select: { name: true, description: true, icon: true, banner: true, vanitySlug: true, id: true, category: true },
  });

  if (!guild) {
    return { title: "Community not found | ApplyHub by RoleFlow", robots: { index: false } };
  }

  const title = `${guild.name} | ApplyHub by RoleFlow`;
  const description =
    guild.description?.slice(0, 200) ||
    `Apply to open positions at ${guild.name} on ApplyHub by RoleFlow.`;
  const url = `${SITE_URL}/c/${guild.vanitySlug || guild.id}`;
  const images = [previewImage(guild.banner) ?? previewImage(guild.icon) ?? `${SITE_URL}/logo.png`];

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "ApplyHub by RoleFlow",
      title,
      description,
      url,
      images: images.map((src) => ({ url: src, alt: `${guild.name} on ApplyHub by RoleFlow` })),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export default async function CommunityPortalPage({ params, embedded = false }: CommunityPortalProps) {
  // Query by vanitySlug OR by ID
  const guild = await prisma.guild.findFirst({
    where: {
      OR: [{ vanitySlug: params.slug }, { id: params.slug }],
    },
    include: {
      positions: {
        where: openNowWhere(),
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

  const responseTime = await getGuildResponseTime(guild.id);
  const savedIds = new Set<string>(
    currentUser
      ? (
          await prisma.savedPosition.findMany({
            where: { userId: currentUser.id, positionId: { in: guild.positions.map((p) => p.id) } },
            select: { positionId: true },
          })
        ).map((r) => r.positionId)
      : []
  );

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

  const tags = guild.tags ? guild.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const accent = (guild as any).accentColor || "#e5532d";
  const layout = (guild as any).portalLayout || "list";

  const badges = guild.verifiedBadges
    ? guild.verifiedBadges.split(",").map((b) => b.trim()).filter(Boolean)
    : guild.isVerified
    ? [guild.verifiedBadge || "VERIFIED"]
    : [];

  return (
    <div className="page-wrap pt-10 pb-20 sm:pt-14">
      {!embedded && (
        <Link href="/browse" className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink">
          <ArrowLeft className="h-3.5 w-3.5" />
          All communities
        </Link>
      )}

      {/* Profile */}
      <header className="mt-8 grid gap-8 border-b border-line pb-10 md:grid-cols-[1fr_auto] md:items-end">
        <div className="min-w-0">
          <div className="h-1.5 w-16" style={{ background: accent }} aria-hidden="true" />

          <div className="mt-6 flex items-start gap-5">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-line-strong bg-surface sm:h-24 sm:w-24">
              {guild.icon ? (
                <img src={guild.icon} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-[34px] text-ink">{guild.name.charAt(0)}</span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="display-lg">{guild.name}</h1>
                {badges.map((b) => (
                  <span key={b} className="badge-accent">
                    <BadgeCheck className="h-3 w-3" />
                    {b.replace(/_/g, " ").toLowerCase()}
                  </span>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-muted">
                {guild.category && <span>{guild.category}</span>}
                <span className="text-moss">
                  {guild.positions.length} open position{guild.positions.length === 1 ? "" : "s"}
                </span>
                {responseTime && <span>Usually decides in {responseTime}</span>}
                {totalReviews > 0 && readSiteConfig(guild.siteConfig).showReviews && (
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums text-ink-2">
                    <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                    {avgRating} · {totalReviews} review{totalReviews === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {guild.description && (
            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ink-2">{guild.description}</p>
          )}

          {guild.welcomeMessage && (
            <p className="mt-5 max-w-2xl whitespace-pre-wrap border-l-2 border-accent pl-4 text-[15px] leading-relaxed text-ink-2">
              {guild.welcomeMessage}
            </p>
          )}

          {(guild.websiteUrl || guild.discordInviteUrl) && (
            <div className="mt-5 flex flex-wrap gap-4 text-[14px]">
              {guild.websiteUrl && (
                <a href={guild.websiteUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-ink underline decoration-line-strong underline-offset-4 hover:decoration-accent">
                  Website ↗
                </a>
              )}
              {guild.discordInviteUrl && (
                <a href={guild.discordInviteUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-ink underline decoration-line-strong underline-offset-4 hover:decoration-accent">
                  Join the Discord ↗
                </a>
              )}
            </div>
          )}

          {tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="chip">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/dashboard/${guild.id}`} className="btn-ghost">
            Staff portal
          </Link>
          <ReportButton targetType="GUILD" targetId={guild.id} />
        </div>
      </header>

      {guild.announcement && (
        <div className="mb-8 rounded-xl border border-line bg-accent-soft p-4 text-[14px] leading-relaxed text-ink">
          <span className="eyebrow mr-2">Notice</span>
          {guild.announcement}
        </div>
      )}

      {/* Open positions */}
      <section className="mt-12">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="display-md">Open positions</h2>
          <span className="font-mono text-[13px] text-muted tabular-nums">{guild.positions.length} listed</span>
        </div>

        {guild.positions.length === 0 ? (
          <div className="card px-6 py-14 text-center">
            <p className="text-[15px] text-muted">There are no active openings for this community right now.</p>
          </div>
        ) : (
          <ul className={layout === "cards" ? "grid grid-cols-1 gap-4 md:grid-cols-2" : "divide-y divide-line border-y border-line"}>
            {guild.positions.map((pos) => (
              <li
                key={pos.id}
                className={
                  layout === "cards"
                    ? "card flex flex-col justify-between gap-5 p-6"
                    : "flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
                }
              >
                <div className="max-w-2xl space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-[22px] leading-snug text-ink">{pos.title}</h3>
                    {pos.department && <span className="chip">{pos.department}</span>}
                  </div>
                  <p className="line-clamp-2 text-[14px] leading-relaxed text-ink-2">{pos.description}</p>
                  {guild.showApplicantCount && (
                    <p className="font-mono text-[12px] text-faint tabular-nums">{pos._count.applications} submitted</p>
                  )}
                  {(pos.closesAt || pos.maxApplications) && (
                    <p className="font-mono text-[12px] text-faint">
                      {pos.closesAt ? `Closes ${new Date(pos.closesAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
                      {pos.closesAt && pos.maxApplications ? " · " : ""}
                      {pos.maxApplications ? `Limited to ${pos.maxApplications}${pos.waitlistEnabled ? " + waitlist" : ""}` : ""}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <SaveOpeningButton positionId={pos.id} initialSaved={savedIds.has(pos.id)} signedIn={Boolean(currentUser)} />
                  <ReportButton targetType="POSITION" targetId={pos.id} />
                  <Link href={`/apply/${pos.id}`} className="btn-accent">
                    Apply <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Reviews */}
      <section className="mt-16">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="display-md">Member reviews</h2>
            <p className="mt-2 text-[14px] text-muted">Written by applicants accepted into {guild.name}.</p>
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
          <div className="card px-6 py-14 text-center">
            <h3 className="display-md">No reviews yet</h3>
            <p className="mx-auto mt-2 max-w-sm text-[14px] text-muted">
              Accepted applicants can share their experience of joining this community.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-5 border-b border-line pb-6">
              <span className="font-display text-[56px] leading-none text-ink tabular-nums">{avgRating}</span>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? "fill-gold text-gold" : "text-line-strong"}`} />
                  ))}
                </div>
                <p className="mt-1 text-[13px] text-muted">
                  From {totalReviews} verified applicant review{totalReviews === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {guild.reviews.map((rev) => (
                <article key={rev.id} className="card flex flex-col justify-between gap-5 p-6">
                  <div>
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-sm border border-line bg-sunk">
                          {rev.user.avatar ? (
                            <img src={rev.user.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="grid h-full w-full place-items-center font-display text-[15px] text-ink">
                              {rev.user.username.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-[14px] font-medium text-ink">{rev.user.username}</div>
                          {rev.user.robloxUsername && (
                            <div className="font-mono text-[11px] text-muted">@{rev.user.robloxUsername}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-3.5 w-3.5 ${s <= rev.rating ? "fill-gold text-gold" : "text-line-strong"}`} />
                        ))}
                      </div>
                    </div>

                    <p className="whitespace-pre-wrap font-display text-[18px] leading-relaxed text-ink">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>

                  <p className="border-t border-line pt-3 font-mono text-[11px] uppercase tracking-wide text-faint">
                    Accepted member ·{" "}
                    {new Date(rev.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Discord widget */}
      {guild.discordWidgetEnabled && /^\d{17,20}$/.test(guild.id) && (
        <section className="mt-16">
          <h2 className="eyebrow mb-4 flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            Live Discord
          </h2>
          <iframe
            src={`https://discord.com/widget?id=${guild.id}&theme=light`}
            width="100%"
            height="350"
            allowTransparency={true}
            frameBorder="0"
            sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
            className="w-full rounded-lg border border-line"
          />
        </section>
      )}
    </div>
  );
}
