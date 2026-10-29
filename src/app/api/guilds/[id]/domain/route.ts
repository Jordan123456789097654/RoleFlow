import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";
import { isGuildPaid } from "@/lib/licensing";
import {
  describeDomain,
  normalizeDomain,
  vercelAddDomain,
  vercelRemoveDomain,
} from "@/lib/custom-domain";

export const dynamic = "force-dynamic";

const SELECT = {
  customDomain: true,
  customDomainToken: true,
  customDomainVerified: true,
  customDomainVerifiedAt: true,
} as const;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;
  const guild = await prisma.guild.findUnique({ where: { id: params.id }, select: SELECT });
  if (!guild) return NextResponse.json({ error: "Community not found" }, { status: 404 });
  return NextResponse.json(describeDomain(guild));
}

/** Connects a domain. The owner must then add the TXT record and call /verify. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;

  if (!(await isGuildPaid(params.id))) {
    return NextResponse.json({ error: "Custom domains are part of a paid plan." }, { status: 402 });
  }

  const body = await request.json().catch(() => null);
  const domain = normalizeDomain(body?.domain);
  if (!domain) {
    return NextResponse.json(
      { error: "Enter a domain you own, like apply.yourcommunity.com. RoleFlow's own domains can't be used." },
      { status: 400 }
    );
  }

  const taken = await prisma.guild.findFirst({
    where: { customDomain: domain, NOT: { id: params.id } },
    select: { id: true },
  });
  if (taken) {
    return NextResponse.json({ error: "That domain is already connected to another community." }, { status: 409 });
  }

  const current = await prisma.guild.findUnique({ where: { id: params.id }, select: { customDomain: true } });
  if (current?.customDomain && current.customDomain !== domain) {
    await vercelRemoveDomain(current.customDomain);
  }

  const token = randomBytes(16).toString("hex");
  try {
    await prisma.guild.update({
      where: { id: params.id },
      data: { customDomain: domain, customDomainToken: token, customDomainVerified: false, customDomainVerifiedAt: null },
    });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "That domain is already connected to another community." }, { status: 409 });
    }
    throw e;
  }

  const added = await vercelAddDomain(domain);
  const guild = await prisma.guild.findUnique({ where: { id: params.id }, select: SELECT });
  return NextResponse.json({
    ...describeDomain(guild!),
    message: "Domain saved. Add the DNS records below, then click Check verification.",
    warning: added.ok ? undefined : added.error,
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;
  const guild = await prisma.guild.findUnique({ where: { id: params.id }, select: SELECT });
  if (guild?.customDomain) await vercelRemoveDomain(guild.customDomain);
  await prisma.guild.update({
    where: { id: params.id },
    data: { customDomain: null, customDomainToken: null, customDomainVerified: false, customDomainVerifiedAt: null },
  });
  return NextResponse.json({ ...describeDomain({ customDomain: null, customDomainToken: null, customDomainVerified: false, customDomainVerifiedAt: null }), message: "Domain removed." });
}
