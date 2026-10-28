import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { isSiteAdminUser, isFounderUser } from "@/lib/roles";
import { getFlags, FLAG_DEFAULTS } from "@/lib/feature-flags";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

async function currentUser() {
  const userId = await verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId }, select: { id: true, isSiteAdmin: true, siteRole: true } });
}

export async function GET() {
  const me = await currentUser();
  if (!me || !isSiteAdminUser(me)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await getFlags());
}

/** Founder only. Only keys in FLAG_DEFAULTS can be changed. */
export async function PUT(request: Request) {
  const me = await currentUser();
  if (!me || !isFounderUser(me)) return NextResponse.json({ error: "Forbidden: Founder access required" }, { status: 403 });

  const { flags } = await request.json();
  const next: Record<string, boolean> = { ...(await getFlags()) };
  for (const key of Object.keys(FLAG_DEFAULTS)) {
    if (typeof flags?.[key] === "boolean") next[key] = flags[key];
  }
  await prisma.systemSetting.upsert({
    where: { key: "feature_flags" },
    update: { value: JSON.stringify(next) },
    create: { key: "feature_flags", value: JSON.stringify(next) },
  });
  await recordAudit({ actorId: me.id, action: "FLAGS_UPDATE", details: next });
  return NextResponse.json(next);
}
