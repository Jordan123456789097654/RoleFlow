import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue } from "@/lib/session";
import { PENDING_2FA_COOKIE, requiresSecondFactor } from "@/lib/second-factor";
import { generateTotpSecret, otpauthUrl } from "@/lib/totp";

export const dynamic = "force-dynamic";

/** Starts (or restarts) TOTP enrollment for a pending site-admin login. */
export async function POST() {
  const userId = await verifySessionValue(cookies().get(PENDING_2FA_COOKIE)?.value);
  if (!userId) return NextResponse.json({ error: "Your 2FA step has expired. Please sign in again." }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !requiresSecondFactor(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (user.totpEnabled) return NextResponse.json({ error: "2FA is already enabled." }, { status: 400 });

  const secret = generateTotpSecret();
  await prisma.user.update({ where: { id: userId }, data: { totpSecret: secret } });
  return NextResponse.json({ secret, otpauthUrl: otpauthUrl(secret, user.username) });
}
