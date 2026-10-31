import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRosterApplyHubToken } from "@/lib/roster-applyhub-token";

export const dynamic = "force-dynamic";

/**
 * Internal ApplyHub API for Accepted Applicants
 * Specification 6:
 * GET /api/roster/applications/accepted?groupId=...
 * - Authenticated with short-lived signed token issued from the Roster session (Authorization: Bearer <token> or query ?token=...)
 * - Read-only.
 * - Returns only the fields in 4.4 (applicant identity, robloxUserId, username, position/rank).
 * - Returns 503 when SITE_LOCKDOWN=true.
 */
export async function GET(request: Request) {
  // Check lockdown condition
  if (process.env.SITE_LOCKDOWN === "true") {
    return NextResponse.json(
      { error: "Service unavailable: Site is in maintenance/lockdown mode." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");
  const authHeader = request.headers.get("authorization");
  const queryToken = searchParams.get("token");

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : queryToken;

  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized: Missing short-lived authorization token." },
      { status: 401 }
    );
  }

  const verified = verifyRosterApplyHubToken(token);
  if (!verified || (groupId && verified.g !== groupId)) {
    return NextResponse.json(
      { error: "Forbidden: Invalid or expired signed session token." },
      { status: 403 }
    );
  }

  if (!groupId) {
    return NextResponse.json({ error: "groupId is required" }, { status: 400 });
  }

  // Find the group to get robloxGroupId
  const rosterGroup = await prisma.rosterGroup.findUnique({
    where: { id: groupId },
    include: { staffRecords: true },
  });

  if (!rosterGroup || rosterGroup.archivedAt) {
    return NextResponse.json({ error: "Roster group not found" }, { status: 404 });
  }

  // Find ApplyHub community / guild matching this Roblox Group ID
  const guild = await prisma.guild.findFirst({
    where: { robloxGroupId: rosterGroup.robloxGroupId },
  });

  if (!guild) {
    // If no matching community registered on ApplyHub yet, return empty list
    return NextResponse.json({
      groupId: rosterGroup.id,
      robloxGroupId: rosterGroup.robloxGroupId,
      applications: [],
    });
  }

  // Query accepted applications for this guild
  const acceptedApplications = await prisma.application.findMany({
    where: {
      position: { guildId: guild.id },
      status: "ACCEPTED",
      archivedAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          robloxId: true,
          robloxUsername: true,
        },
      },
      position: {
        select: {
          id: true,
          title: true,
          department: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Track which applications are already imported as staff records
  const existingRobloxIds = new Set(rosterGroup.staffRecords.map((s) => s.robloxUserId));
  const existingAppIds = new Set(
    rosterGroup.staffRecords
      .map((s) => s.sourceApplicationId)
      .filter(Boolean)
  );

  // Filter and expose strictly the fields defined in 4.4
  const payload = acceptedApplications.map((app) => {
    const robloxUserId = app.user.robloxId || "";
    const username = app.user.robloxUsername || app.user.username || `User_${app.userId}`;
    const alreadyStaff = existingRobloxIds.has(robloxUserId) || existingAppIds.has(app.id);

    return {
      applicationId: app.id,
      applicantUserId: app.userId,
      robloxUserId,
      username,
      positionTitle: app.position.title,
      department: app.position.department,
      acceptedAt: app.updatedAt.toISOString(),
      alreadyStaff,
    };
  });

  return NextResponse.json({
    groupId: rosterGroup.id,
    robloxGroupId: rosterGroup.robloxGroupId,
    applications: payload,
  });
}
