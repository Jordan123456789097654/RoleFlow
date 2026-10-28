import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue } from "@/lib/session";
import { PENDING_2FA_COOKIE, requiresSecondFactor } from "@/lib/second-factor";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await verifySessionValue(cookies().get(PENDING_2FA_COOKIE)?.value);
  if (!userId) return NextResponse.json({ error: "Your 2FA step has expired. Please sign in again." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !requiresSecondFactor(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ enabled: user.totpEnabled });
}
