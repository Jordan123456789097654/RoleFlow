import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";
import { SHIFT_LOG_TYPES } from "@/lib/compliance";

export const dynamic = "force-dynamic";

const MAX_BACKDATE_DAYS = 14;

/** Pending manual log requests. Managers only. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;
  const requests = await prisma.manualLogRequest.findMany({
    where: { guildId: params.id, status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: { id: true, staffUserId: true, robloxUserId: true, shiftType: true, description: true, workedAt: true, minutes: true, createdAt: true },
  });
  return NextResponse.json({ requests });
}

/** A staff member asks for time worked outside the game (design, mapping, training prep). */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "view");
  if (!access.ok) return access.response;

  const staff = await prisma.guildStaff.findUnique({
    where: { guildId_userId: { guildId: params.id, userId: access.userId } },
    select: { robloxUserId: true },
  });
  if (!staff) return NextResponse.json({ error: "Only staff members can request manual logs." }, { status: 403 });
  if (!staff.robloxUserId) return NextResponse.json({ error: "Link your Roblox account first." }, { status: 400 });

  const body = await req.json().catch(() => null);
  const description = String(body?.description ?? "").trim();
  const minutes = Number(body?.minutes);
  const shiftType = SHIFT_LOG_TYPES.includes(body?.shiftType) ? body.shiftType : "MANUAL";
  const workedAt = new Date(String(body?.workedAt ?? ""));
  const now = new Date();

  if (!description || description.length > 500) return NextResponse.json({ error: "Describe the work (max 500 characters)." }, { status: 400 });
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 720) return NextResponse.json({ error: "Minutes must be 1-720." }, { status: 400 });
  if (Number.isNaN(workedAt.getTime())) return NextResponse.json({ error: "Pick when the work happened." }, { status: 400 });
  if (workedAt > now) return NextResponse.json({ error: "The work date can't be in the future." }, { status: 400 });
  if (now.getTime() - workedAt.getTime() > MAX_BACKDATE_DAYS * 86_400_000)
    return NextResponse.json({ error: `Requests can only cover the last ${MAX_BACKDATE_DAYS} days.` }, { status: 400 });

  await prisma.manualLogRequest.create({
    data: { guildId: params.id, staffUserId: access.userId, robloxUserId: staff.robloxUserId, shiftType, description, workedAt, minutes },
  });
  return NextResponse.json({ ok: true });
}
