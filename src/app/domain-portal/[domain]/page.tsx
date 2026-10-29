import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CommunityPortalPage, { generateMetadata as communityMetadata } from "@/app/c/[slug]/page";
import { guildForCustomDomain, normalizeDomain } from "@/lib/custom-domain";

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
  return guild ? { domain, slug: guild.vanitySlug || guild.id } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await resolve(params);
  if (!found) return { robots: { index: false } };
  const base = await communityMetadata({ params: { slug: found.slug } });
  const url = `https://${found.domain}/`;
  return { ...base, alternates: { canonical: url }, openGraph: { ...(base.openGraph as object), url } };
}

export default async function DomainPortal({ params }: Props) {
  const found = await resolve(params);
  if (!found) notFound();
  return <CommunityPortalPage params={{ slug: found.slug }} />;
}
