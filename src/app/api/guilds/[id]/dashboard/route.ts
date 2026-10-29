import { isFounderId } from "@/lib/roles";
import { verifySessionValue } from "@/lib/session";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sanitizeGuild, SAFE_USER_SELECT } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const userId = await verifySessionValue(cookieStore.get("roleflow_user_id")?.value);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found." }, { status: 401 });
    }

    const guild = await prisma.guild.findUnique({
      where: { id: params.id },
      include: {
        positions: {
          include: {
            questions: { orderBy: { order: "asc" } },
            _count: { select: { applications: true } },
          },
        },
        blacklists: true,
        staffTeam: true,
      },
    });

    if (!guild) {
      return NextResponse.json({ error: "Guild not found" }, { status: 404 });
    }

    // STRICT PERMISSION CHECK: Must be the community owner, appointed sub-staff, or designated site super-admin
    const isOwner = guild.ownerId === currentUser.id;
    const isSiteAdmin = currentUser.isSiteAdmin || isFounderId(currentUser.id);
    const staffMember = guild.staffTeam.find((s) => s.userId === currentUser.id);
    const isStaff = !!staffMember;

    if (!isOwner && !isSiteAdmin && !(isStaff && staffMember?.permissions !== "view_only")) {
      return NextResponse.json(
        { error: "Forbidden: You do not own or manage this community." },
        { status: 403 }
      );
    }

    // Fetch applications for all positions in this guild
    const showArchived = new URL(request.url).searchParams.get("archived") === "1";
    const applications = await prisma.application.findMany({
      where: {
        position: { guildId: params.id },
        ...(showArchived ? {} : { archivedAt: null }),
      },
      include: {
        user: { select: SAFE_USER_SELECT },
        position: true,
        answers: {
          include: { question: true },
        },
        reviews: {
          include: { reviewer: { select: SAFE_USER_SELECT } },
          orderBy: { createdAt: "desc" },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ...sanitizeGuild(guild, { keepLicense: isOwner || isSiteAdmin }),
      applications,
      isOwner,
      isSiteAdmin,
      staffMember,
      currentPermission: isOwner || isSiteAdmin ? "owner" : staffMember?.permissions || "view_only",
    });
  } catch (err: any) {
    console.error("Dashboard fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
