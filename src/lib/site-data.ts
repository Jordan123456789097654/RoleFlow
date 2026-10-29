import { prisma } from "./prisma";
import { readSiteConfig, type SiteConfig } from "./site-config";

/** The columns the site editor reads and writes. */
export const SITE_FIELDS = {
  id: true,
  name: true,
  vanitySlug: true,
  icon: true,
  banner: true,
  description: true,
  announcement: true,
  welcomeMessage: true,
  websiteUrl: true,
  discordInviteUrl: true,
  portalAccentColor: true,
  portalLayout: true,
  showApplicantCount: true,
  customDomain: true,
  customDomainVerified: true,
  siteConfig: true,
} as const;

export type SiteData = {
  id: string;
  name: string;
  vanitySlug: string | null;
  icon: string | null;
  banner: string | null;
  description: string | null;
  announcement: string | null;
  welcomeMessage: string | null;
  websiteUrl: string | null;
  discordInviteUrl: string | null;
  portalAccentColor: string | null;
  portalLayout: string;
  showApplicantCount: boolean;
  customDomain: string | null;
  customDomainVerified: boolean;
  siteConfig: SiteConfig;
};

export async function loadSite(guildId: string): Promise<SiteData | null> {
  const g = await prisma.guild.findUnique({ where: { id: guildId }, select: SITE_FIELDS });
  if (!g) return null;
  return { ...g, siteConfig: readSiteConfig(g.siteConfig) };
}
