import { prisma } from "@/lib/prisma";
import { statusJson, statusOptions } from "@/lib/status-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function OPTIONS() {
  return statusOptions();
}

/** Public: custom domain hosting health. Counts only, no domain names or communities. */
export async function GET() {
  const [connected, verified, lastVerified] = await Promise.all([
    prisma.guild.count({ where: { customDomain: { not: null } } }),
    prisma.guild.count({ where: { customDomain: { not: null }, customDomainVerified: true } }),
    prisma.guild.findFirst({ where: { customDomainVerifiedAt: { not: null } }, orderBy: { customDomainVerifiedAt: "desc" }, select: { customDomainVerifiedAt: true } }),
  ]);

  return statusJson({
    updatedAt: new Date().toISOString(),
    domains: {
      connected,
      verified,
      awaitingVerification: Math.max(0, connected - verified),
      lastVerifiedAt: lastVerified?.customDomainVerifiedAt ?? null,
    },
  });
}
