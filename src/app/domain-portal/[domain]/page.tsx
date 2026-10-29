import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CommunityPortalPage, { generateMetadata as communityMetadata } from "@/app/c/[slug]/page";
import { guildForCustomDomain, normalizeDomain } from "@/lib/custom-domain";
import { prisma } from "@/lib/prisma";
import { readSiteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: { domain: string };
}

/** Only serves the request when the Host header is the domain itself, so this path isn't reachable on roleflow.site. */
async function resolve(params: Props["params"]) {
  const domain = normalizeDomain(decodeURIComponent(params.domain));
  if (!domain) return null;
  const host = (headers().get("x-forwarded-host") || headers().get("host") || "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");
  if (host !== domain) return null;
  const guild = await guildForCustomDomain(domain);
  return guild ? { domain, slug: guild.vanitySlug || guild.id, guildId: guild.id } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await resolve(params);
  if (!found) return { robots: { index: false } };
  const base = await communityMetadata({ params: { slug: found.slug } });
  const url = `https://${found.domain}/`;
  // Keep RoleFlow out of the page's title, share preview and tab icon. Only the community's name shows.
  const g = await prisma.guild.findUnique({
    where: { id: found.guildId },
    select: { name: true, icon: true, siteConfig: true },
  });
  const name = g?.name ?? "Community";
  const site = readSiteConfig(g?.siteConfig);
  const title = site.seoTitle || name;
  const description = site.seoDescription || (base.description as string | undefined);
  const icon = g?.icon && g.icon.startsWith("https://") ? g.icon : undefined;
  return {
    ...base,
    title,
    description,
    alternates: { canonical: url },
    openGraph: { ...(base.openGraph as object), siteName: name, title, description, url },
    twitter: { ...(base.twitter as object), title, description },
    ...(icon ? { icons: { icon } } : {}),
  };
}

export default async function DomainPortal({ params }: Props) {
  const found = await resolve(params);
  if (!found) notFound();
  return <CommunityPortalPage params={{ slug: found.slug }} embedded />;
}
