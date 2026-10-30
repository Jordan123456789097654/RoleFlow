import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { getFounderCaller } from "@/lib/staff-access";
import { setSessionCookie } from "@/lib/session-cookie";
import { signSessionValue } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Emergency response. Founder only.
 * signOutEveryone: ends every session on the platform, including other founders and admins.
 * The caller stays signed in on this browser.
 */
export async function POST(request: Request) {
  const caller = await getFounderCaller();
  if (!caller) return NextResponse.json({ error: "Only the founder can use emergency tools." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const action = String(body?.action ?? "");
  const reason = String(body?.reason ?? "").trim();
  if (reason.length < 10) return NextResponse.json({ error: "Give a reason of at least 10 characters. It is kept in the audit log." }, { status: 400 });

  if (action !== "signOutEveryone") return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  if (body?.confirm !== "SIGN OUT EVERYONE") return NextResponse.json({ error: 'Type SIGN OUT EVERYONE to confirm.' }, { status: 400 });

  const result = await prisma.user.updateMany({ data: { sessionVersion: { increment: 1 } } });
  // Keep the founder signed in on this browser by issuing a fresh cookie for the new version.
  const me = await prisma.user.findUnique({ where: { id: caller.id }, select: { sessionVersion: true } });

  await recordAudit({ actorId: caller.id, action: "EMERGENCY_SIGN_OUT_ALL", details: { reason, accounts: result.count } });

  const res = NextResponse.json({ success: true, signedOut: result.count });
  if (me) setSessionCookie(res, signSessionValue(caller.id, me.sessionVersion));
  return res;
}
