import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/signed-token";

export const dynamic = "force-dynamic";

/** Resolves the signed, expiring appeal token from the email link to a punishment. */
async function fromToken(token: string | null) {
  const data = verifyToken<{ p: string }>("appeal", token);
  if (!data || typeof data.p !== "string") return null;
  return prisma.punishment.findUnique({ where: { id: data.p } });
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const p = await fromToken(token);
  if (!p) return NextResponse.json({ error: "This appeal link is invalid." }, { status: 400 });
  return NextResponse.json({
    action: p.action,
    reason: p.reason,
    expiresAt: p.expiresAt,
    appealStatus: p.appealStatus,
    decisionNote: p.decisionNote,
  });
}

/** Submit an appeal. One per punishment; a denied appeal cannot be resubmitted. */
export async function POST(request: Request) {
  const { token, text } = await request.json();
  const p = await fromToken(token ?? null);
  if (!p) return NextResponse.json({ error: "This appeal link is invalid." }, { status: 400 });
  if (p.appealStatus !== "NONE") {
    return NextResponse.json({ error: "An appeal for this decision was already submitted." }, { status: 409 });
  }
  if (!text || String(text).trim().length < 10) {
    return NextResponse.json({ error: "Please explain your appeal in at least 10 characters." }, { status: 400 });
  }
  await prisma.punishment.update({
    where: { id: p.id },
    data: { appealStatus: "PENDING", appealText: String(text).slice(0, 2000), appealedAt: new Date() },
  });
  return NextResponse.json({ success: true });
}
