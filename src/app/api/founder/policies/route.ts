import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFounderCaller } from "@/lib/staff-access";
import { POLICY_SLUGS, getPolicy } from "@/lib/policies";

export const dynamic = "force-dynamic";

/** Every policy with its current content and whether it has been customised. */
export async function GET() {
  if (!(await getFounderCaller())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const custom = await prisma.policyDocument.findMany({ select: { slug: true, updatedAt: true } });
  const customMap = new Map(custom.map((c) => [c.slug, c.updatedAt]));
  const policies = await Promise.all(
    POLICY_SLUGS.map(async (slug) => ({
      slug,
      ...(await getPolicy(slug)),
      customised: customMap.has(slug),
      customisedAt: customMap.get(slug) ?? null,
    }))
  );
  return NextResponse.json({ policies });
}
