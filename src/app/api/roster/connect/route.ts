import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessRoster } from "@/lib/roster-access";
import { isSiteAdminUser } from "@/lib/roles";
import { previewRobloxGroup, confirmConnectRobloxGroup } from "@/lib/roster-group-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      robloxId: user.robloxId || null,
      robloxUsername: user.robloxUsername || null,
      isSiteAdmin: isSiteAdminUser(user),
    },
  });
}

export async function POST(request: Request) {
  // 1. Strict access check (Feature flag + Owner allowlist)
  const user = await getCurrentUser();
  if (!canAccessRoster({ userId: user?.id, isSiteAdmin: user?.isSiteAdmin, siteRole: user?.siteRole })) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  if (!user || !user.robloxId) {
    return NextResponse.json(
      { error: "You must have a linked Roblox account in Settings to connect a Roblox group." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { robloxGroupId, confirm } = body;

  if (!robloxGroupId) {
    return NextResponse.json({ error: "Roblox Group ID is required." }, { status: 400 });
  }

  const input = {
    userId: user.id,
    userRobloxId: user.robloxId,
    userRobloxUsername: user.robloxUsername,
    isSiteAdmin: isSiteAdminUser(user),
    robloxGroupId,
  };

  // If confirm flag is true, write to DB atomically
  if (confirm === true) {
    const result = await confirmConnectRobloxGroup(input);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, groupId: result.groupId });
  }

  // Otherwise, return read-only preview without committing changes
  const preview = await previewRobloxGroup(input);
  if (!preview.eligible) {
    return NextResponse.json({ error: preview.error }, { status: 400 });
  }

  return NextResponse.json({
    eligible: true,
    groupName: preview.groupName,
    memberCount: preview.memberCount,
    rolesCount: preview.roles.length,
    previewMembersCount: preview.membersPreview.length,
    roles: preview.roles,
    members: preview.membersPreview.slice(0, 20),
  });
}
