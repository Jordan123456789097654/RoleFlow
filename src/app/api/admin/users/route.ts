import { recordAudit } from "@/lib/audit";
import { verifySessionValue } from "@/lib/session";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = await verifySessionValue(cookieStore.get("roleflow_user_id")?.value);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isFounder = currentUser?.isSiteAdmin || currentUser?.id === "1046538179399929957";

    if (!isFounder) {
      return NextResponse.json({ error: "Forbidden: Founder access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    const users = await prisma.user.findMany({
      where: query
        ? {
            OR: [
              { username: { contains: query, mode: "insensitive" } },
              { id: { contains: query } },
              { robloxUsername: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      select: {
        id: true,
        username: true,
        avatar: true,
        email: true,
        robloxUsername: true,
        isSiteAdmin: true,
        isSupportStaff: true,
        siteRole: true,
        createdAt: true,
        _count: {
          select: { applications: true },
        },
      },
      orderBy: [
        { isSiteAdmin: "desc" },
        { isSupportStaff: "desc" },
        { createdAt: "desc" },
      ],
      take: 50,
    });

    return NextResponse.json(users);
  } catch (err) {
    console.error("Admin users list error:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = await verifySessionValue(cookieStore.get("roleflow_user_id")?.value);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isFounder = currentUser?.siteRole === "FOUNDER" || currentUser?.id === "1046538179399929957";

    if (!isFounder) {
      return NextResponse.json({ error: "Forbidden: Founder access required" }, { status: 403 });
    }

    const body = await request.json();
    const { targetUserId, isSupportStaff, isSiteAdmin, siteRole } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    // Do not allow demoting the Founder
    if (targetUserId === "1046538179399929957" && siteRole && siteRole !== "FOUNDER") {
      return NextResponse.json({ error: "The Platform Founder role cannot be altered." }, { status: 400 });
    }

    let updateData: any = {};

    if (siteRole) {
      updateData.siteRole = siteRole;
      if (siteRole === "ADMIN" || siteRole === "FOUNDER") {
        updateData.isSiteAdmin = true;
        updateData.isSupportStaff = true;
      } else if (siteRole === "MODERATOR" || siteRole === "SUPPORT" || siteRole === "STAFF") {
        updateData.isSiteAdmin = false;
        updateData.isSupportStaff = true;
      } else {
        updateData.isSiteAdmin = false;
        updateData.isSupportStaff = false;
      }
    } else {
      if (typeof isSupportStaff === "boolean") updateData.isSupportStaff = isSupportStaff;
      if (typeof isSiteAdmin === "boolean") updateData.isSiteAdmin = isSiteAdmin;
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
    });

    await recordAudit({ actorId: userId!, action: "USER_ROLE_UPDATE", targetId: targetUserId, details: { siteRole, isSupportStaff, isSiteAdmin } });
    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("Admin user role update error:", err);
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = await verifySessionValue(cookieStore.get("roleflow_user_id")?.value);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isFounder = currentUser?.siteRole === "FOUNDER" || currentUser?.id === "1046538179399929957";

    if (!isFounder) {
      return NextResponse.json({ error: "Forbidden: Founder access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const purgeImported = searchParams.get("purgeImported");
    const targetUserId = searchParams.get("userId");

    if (purgeImported === "true") {
      const deleted = await prisma.user.deleteMany({
        where: { id: { startsWith: "imported_" } },
      });
      return NextResponse.json({ success: true, count: deleted.count, message: `Purged ${deleted.count} imported accounts.` });
    }

    if (targetUserId) {
      if (targetUserId === "1046538179399929957") {
        return NextResponse.json({ error: "Cannot delete Platform Founder." }, { status: 400 });
      }
      await prisma.user.delete({ where: { id: targetUserId } });
      await recordAudit({ actorId: userId!, action: "USER_DELETE", targetId: targetUserId });
      return NextResponse.json({ success: true, message: "User deleted." });
    }

    return NextResponse.json({ error: "Specify userId or purgeImported=true" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
