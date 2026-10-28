import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import {
  PENDING_2FA_COOKIE,
  requiresSecondFactor,
  consumeRecoveryCode,
  setSessionCookie,
  notifyNewDevice,
} from "@/lib/second-factor";
import { verifyTotp } from "@/lib/totp";

export const dynamic = "force-dynamic";

/** Completes a site-admin sign-in with a TOTP code or a one-time recovery code. */
export async function POST(request: Request) {
  const userId = await verifySessionValue(cookies().get(PENDING_2FA_COOKIE)?.value);
  if (!userId) return NextResponse.json({ error: "Your 2FA step has expired. Please sign in again." }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !requiresSecondFactor(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.totpEnabled || !user.totpSecret) {
    return NextResponse.json({ error: "2FA is not set up yet." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  let ok = false;
  if (body?.code) ok = verifyTotp(user.totpSecret, String(body.code));
  else if (body?.recoveryCode) ok = await consumeRecoveryCode(user.id, user.totpRecoveryCodes, String(body.recoveryCode));

  if (!ok) {
    await recordAudit({ actorId: userId, action: "TWO_FACTOR_FAILED", targetId: userId });
    return NextResponse.json({ error: "Invalid code." }, { status: 401 });
  }

  await recordAudit({ actorId: userId, action: "LOGIN_2FA_SUCCESS", targetId: userId });
  await notifyNewDevice(user, request);
  const res = NextResponse.json({ success: true, redirect: "/" });
  setSessionCookie(res, user.id, user.sessionVersion, request.headers.get("host") || "");
  return res;
}
