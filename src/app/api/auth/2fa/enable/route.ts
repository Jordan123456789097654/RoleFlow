import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import {
  PENDING_2FA_COOKIE,
  requiresSecondFactor,
  generateRecoveryCodes,
  hashRecoveryCodes,
  setSessionCookie,
  notifyNewDevice,
} from "@/lib/second-factor";
import { verifyTotp } from "@/lib/totp";

export const dynamic = "force-dynamic";

/** Confirms the authenticator app works, turns 2FA on, and completes the sign-in. */
export async function POST(request: Request) {
  const userId = await verifySessionValue(cookies().get(PENDING_2FA_COOKIE)?.value);
  if (!userId) return NextResponse.json({ error: "Your 2FA step has expired. Please sign in again." }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !requiresSecondFactor(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (user.totpEnabled) return NextResponse.json({ error: "2FA is already enabled." }, { status: 400 });
  if (!user.totpSecret) return NextResponse.json({ error: "Start setup first." }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  if (!verifyTotp(user.totpSecret, String(body?.code || ""))) {
    return NextResponse.json(
      { error: "Incorrect code. Check that your device's clock is correct and try again." },
      { status: 400 }
    );
  }

  const recoveryCodes = generateRecoveryCodes();
  await prisma.user.update({
    where: { id: userId },
    data: { totpEnabled: true, totpRecoveryCodes: await hashRecoveryCodes(recoveryCodes) },
  });
  await recordAudit({ actorId: userId, action: "TWO_FACTOR_ENABLED", targetId: userId });
  await notifyNewDevice(user, request);

  const res = NextResponse.json({
    success: true,
    recoveryCodes,
    message: "2FA is on. Save these recovery codes somewhere safe. Each works once.",
  });
  setSessionCookie(res, user.id, user.sessionVersion, request.headers.get("host") || "");
  return res;
}
