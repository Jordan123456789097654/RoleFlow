import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { isSiteAdminUser } from "@/lib/roles";
import { applyGuildAction } from "@/lib/punishments";

export const dynamic = "force-dynamic";

/** Pause, unpause, or blacklist many communities at once. */
export async function POST(request: Request) {
  const userId = await verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, isSiteAdmin: true, siteRole: true } });
  if (!me || !isSiteAdminUser(me)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { ids, action, reason } = await request.json();
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 200) {
    return NextResponse.json({ error: "Select between 1 and 200 communities." }, { status: 400 });
  }
  if (!["PAUSE", "UNPAUSE", "BLACKLIST"].includes(action)) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  let done = 0;
  for (const id of ids.map(String)) {
    const guild = await applyGuildAction({ guildId: id, action, reason, issuedById: userId });
    if (guild) done++;
  }
  return NextResponse.json({ success: true, processed: done });
}
