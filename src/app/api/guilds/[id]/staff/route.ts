import { isFounderId } from "@/lib/roles";
import { recordAudit } from "@/lib/audit";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const guild = await prisma.guild.findUnique({
      where: { id: params.id },
      include: {
        staffTeam: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!guild) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const isOwner = guild.ownerId === user.id || user.isSiteAdmin || isFounderId(user.id);
    const isStaff = guild.staffTeam.some((s) => s.userId === user.id);

    if (!isOwner && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(guild.staffTeam);
  } catch (err: any) {
    console.error("Fetch guild staff error:", err);
    return NextResponse.json({ error: "Failed to fetch staff team" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const guild = await prisma.guild.findUnique({ where: { id: params.id } });
    if (!guild) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const isOwner = guild.ownerId === user.id || user.isSiteAdmin || isFounderId(user.id);
    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden: Only community owners can appoint sub-staff." }, { status: 403 });
    }

    const { userId, username, roleTitle, permissions } = await request.json();

    if (!userId || !String(userId).trim()) {
      return NextResponse.json({ error: "Discord Snowflake User ID is required" }, { status: 400 });
    }

    const validPerms = ["view_only", "vote_only", "full_decision", "position_editor"];
    const sanitizedPerms = validPerms.includes(permissions) ? permissions : "vote_only";

    const staff = await prisma.guildStaff.upsert({
      where: {
        guildId_userId: {
          guildId: params.id,
          userId: String(userId).trim(),
        },
      },
      update: {
        roleTitle: roleTitle ? String(roleTitle).trim() : "Reviewer",
        permissions: sanitizedPerms,
        username: username ? String(username).trim() : undefined,
      },
      create: {
        guildId: params.id,
        userId: String(userId).trim(),
        username: username ? String(username).trim() : undefined,
        roleTitle: roleTitle ? String(roleTitle).trim() : "Reviewer",
        permissions: sanitizedPerms,
      },
    });

    await recordAudit({ actorId: user.id, action: "STAFF_UPSERT", targetId: params.id, details: { userId: staff.userId, permissions: sanitizedPerms, roleTitle: staff.roleTitle } });
    return NextResponse.json({ success: true, staff });
  } catch (err: any) {
    console.error("Add guild staff error:", err);
    return NextResponse.json({ error: "Failed to save staff member" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const guild = await prisma.guild.findUnique({ where: { id: params.id } });
    if (!guild) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const isOwner = guild.ownerId === user.id || user.isSiteAdmin || isFounderId(user.id);
    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden: Only community owners can remove sub-staff." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json({ error: "userId query param required" }, { status: 400 });
    }

    await prisma.guildStaff.deleteMany({
      where: {
        guildId: params.id,
        userId: targetUserId,
      },
    });

    await recordAudit({ actorId: user.id, action: "STAFF_REMOVE", targetId: params.id, details: { userId: targetUserId } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete guild staff error:", err);
    return NextResponse.json({ error: "Failed to remove staff member" }, { status: 500 });
  }
}
