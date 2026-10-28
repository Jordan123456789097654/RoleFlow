import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { isFounderUser, isSiteAdminUser } from "@/lib/roles";

export const dynamic = "force-dynamic";

/** Tells the admin UI which panels this account may see. */
export async function GET() {
  const userId = await verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, siteRole: true, isSiteAdmin: true, username: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    username: user.username,
    isFounder: isFounderUser(user),
    isAdmin: isSiteAdminUser(user),
  });
}
