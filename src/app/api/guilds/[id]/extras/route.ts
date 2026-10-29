import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "manage");
  if (!access.ok) return access.response;

  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if ("announcement" in body) {
    const a = typeof body.announcement === "string" ? body.announcement.trim().slice(0, 500) : "";
    data.announcement = a || null;
  }
  if ("autoArchiveDays" in body) {
    const n = Number(body.autoArchiveDays);
    if (!Number.isInteger(n) || n < 0 || n > 365) {
      return NextResponse.json({ error: "Auto-archive must be between 0 and 365 days." }, { status: 400 });
    }
    data.autoArchiveDays = n;
  }
  if ("robloxRequiredAssetId" in body) {
    const raw = String(body.robloxRequiredAssetId ?? "").trim();
    if (raw && !/^\d{1,20}$/.test(raw)) {
      return NextResponse.json({ error: "The Roblox item ID must be numbers only." }, { status: 400 });
    }
    data.robloxRequiredAssetId = raw || null;
  }
  if ("interviewVoice" in body) data.interviewVoice = Boolean(body.interviewVoice);

  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  await prisma.guild.update({ where: { id: params.id }, data });
  return NextResponse.json({ success: true });
}
