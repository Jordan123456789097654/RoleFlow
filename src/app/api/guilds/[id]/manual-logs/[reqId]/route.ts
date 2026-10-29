import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";

export const dynamic = "force-dynamic";

/** Approves or denies a manual log. Approval adds a closed shift for that block of time. */
export async function PUT(req: Request, { params }: { params: { id: string; reqId: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;

  const body = await req.json().catch(() => null);
  const decision = body?.decision;
  if (decision !== "APPROVE" && decision !== "DENY") return NextResponse.json({ error: "decision must be APPROVE or DENY" }, { status: 400 });

  const request = await prisma.manualLogRequest.findFirst({ where: { id: params.reqId, guildId: params.id } });
  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (request.status !== "PENDING") return NextResponse.json({ error: "Already decided" }, { status: 409 });

  const now = new Date();
  // Claim the request first so a double click can't create two shifts.
  const claimed = await prisma.manualLogRequest.updateMany({
    where: { id: request.id, status: "PENDING" },
    data: { status: decision === "APPROVE" ? "APPROVED" : "DENIED", reviewedById: access.userId, reviewedAt: now },
  });
  if (claimed.count === 0) return NextResponse.json({ error: "Already decided" }, { status: 409 });

  if (decision === "APPROVE") {
    const endedAt = new Date(request.workedAt.getTime() + request.minutes * 60_000);
    await prisma.shift.create({
      data: {
        guildId: params.id,
        robloxUserId: request.robloxUserId,
        shiftType: request.shiftType,
        startedAt: request.workedAt,
        lastHeartbeatAt: endedAt,
        endedAt,
        status: "ENDED",
      },
    });
  }
  return NextResponse.json({ ok: true });
}
