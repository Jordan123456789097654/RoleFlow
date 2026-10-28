import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { isFounderUser, isSiteAdminUser } from "@/lib/roles";
import { isLicensingEnabled } from "@/lib/licensing";
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
  return NextResponse.json({ enabled: await isLicensingEnabled() });
}

/** Founder only. Turning licensing off makes every feature free for everyone. */
export async function PUT(request: Request) {
  const me = await currentUser();
  if (!me || !isFounderUser(me)) return NextResponse.json({ error: "Forbidden: Founder access required" }, { status: 403 });
  const { enabled } = await request.json();
  const value = enabled ? "true" : "false";
  await prisma.systemSetting.upsert({
    where: { key: "licensing_enabled" },
    update: { value },
    create: { key: "licensing_enabled", value },
  });
  await recordAudit({ actorId: me.id, action: "LICENSING_TOGGLE", details: { enabled: !!enabled } });
  return NextResponse.json({ enabled: !!enabled });
}
