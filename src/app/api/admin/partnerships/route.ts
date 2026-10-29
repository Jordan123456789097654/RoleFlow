import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { founderUserId } from "@/lib/partnership";

export const dynamic = "force-dynamic";

/** Founder only: partnership applications, pending first. */
export async function GET() {
  if (!(await founderUserId())) return NextResponse.json({ error: "Founder access required." }, { status: 403 });
  const apps = await prisma.partnershipApplication.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: { guild: { select: { id: true, name: true, vanitySlug: true, verifiedBadges: true, memberCount: true } } },
  });
  return NextResponse.json(apps);
}
