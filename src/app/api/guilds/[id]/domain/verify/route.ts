import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";
import {
  describeDomain,
  txtRecordMatches,
  vercelRoutingReady,
  vercelVerifyDomain,
} from "@/lib/custom-domain";

export const dynamic = "force-dynamic";

const SELECT = {
  customDomain: true,
  customDomainToken: true,
  customDomainVerified: true,
  customDomainVerifiedAt: true,
} as const;

/** Checks the TXT record. Once it matches, the domain is marked verified and Vercel is asked to confirm routing. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;

  const guild = await prisma.guild.findUnique({ where: { id: params.id }, select: SELECT });
  if (!guild?.customDomain || !guild.customDomainToken) {
    return NextResponse.json({ error: "Connect a domain first." }, { status: 400 });
  }

  const txtOk = await txtRecordMatches(guild.customDomain, guild.customDomainToken);
  if (!txtOk) {
    return NextResponse.json({
      verified: false,
      message:
        "The TXT record isn't visible yet. Make sure it's added exactly as shown, then wait a few minutes and check again. DNS changes can take up to 48 hours.",
    });
  }

  if (!guild.customDomainVerified) {
    await prisma.guild.update({
      where: { id: params.id },
      data: { customDomainVerified: true, customDomainVerifiedAt: new Date() },
    });
  }

  let routingReady = false;
  let vercelError: string | undefined;
  if (process.env.VERCEL_API_TOKEN && process.env.VERCEL_PROJECT_ID) {
    const v = await vercelVerifyDomain(guild.customDomain);
    vercelError = v.error;
    routingReady = await vercelRoutingReady(guild.customDomain);
  }

  const updated = await prisma.guild.findUnique({ where: { id: params.id }, select: SELECT });
  return NextResponse.json({
    ...describeDomain(updated!),
    verified: true,
    routingReady,
    message: routingReady
      ? `Verified. ${guild.customDomain} is live.`
      : "Ownership verified. Add the routing record below so the domain can reach RoleFlow. Propagation can take a few minutes.",
    warning: vercelError,
  });
}
