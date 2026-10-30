import { recordAudit } from "@/lib/audit";
import { authorizeGuild } from "@/lib/guild-access";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const {
      guildId,
      title,
      department,
      description,
      acceptRoleId,
      isPublic,
      timeLimitMinutes,
      richMediaLinks,
    } = await request.json();

    const __a = await authorizeGuild(String(guildId || ""), "manage");
    if (!__a.ok) return __a.response;
    await recordAudit({ actorId: __a.userId, action: "POSITION_CREATE", targetId: String(guildId), details: { title } });

    if (!guildId || !title || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const position = await prisma.position.create({
      data: {
        guildId,
        title,
        department: department || "General",
        description,
        acceptRoleId: acceptRoleId || null,
        isPublic: isPublic ?? true,
        isOpen: true,
        timeLimitMinutes: timeLimitMinutes !== undefined && timeLimitMinutes !== null && timeLimitMinutes !== "" ? Number(timeLimitMinutes) : null,
        richMediaLinks: richMediaLinks !== undefined ? Boolean(richMediaLinks) : true,
      },
    });

    return NextResponse.json({ success: true, position });
  } catch (err) {
    console.error("Create position error:", err);
    return NextResponse.json({ error: "Failed to create position" }, { status: 500 });
  }
}
