import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createSnapshot, restoreSnapshot, previewRestoreSnapshot } from "@/lib/rankhub/snapshots";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId") || "15982012";

    const snapshots = await prisma.rankHubSnapshot.findMany({
      where: { groupId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      snapshots: snapshots.map((s) => ({
        id: s.id,
        groupId: s.groupId,
        title: s.title,
        memberCount: s.memberCount,
        createdAt: s.createdAt.toISOString(),
        createdBy: s.createdBy,
        data: s.snapshotData,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch snapshots" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser().catch(() => null);
    const body = await req.json();
    const { action, groupId = "15982012", title, snapshotId, previewOnly, customMembers } = body;

    if (action === "create") {
      const snapshot = await createSnapshot(groupId, user?.id || "demo-user", title, customMembers);
      return NextResponse.json({
        success: true,
        message: `Snapshot "${snapshot.title}" created with ${snapshot.memberCount} members.`,
        snapshot: {
          id: snapshot.id,
          groupId: snapshot.groupId,
          title: snapshot.title,
          memberCount: snapshot.memberCount,
          createdAt: snapshot.createdAt.toISOString(),
        },
      });
    }

    if (action === "preview_restore") {
      if (!snapshotId) {
        return NextResponse.json({ error: "snapshotId is required for preview" }, { status: 400 });
      }
      const plan = await previewRestoreSnapshot(groupId, snapshotId, customMembers);
      return NextResponse.json({
        success: true,
        plan,
      });
    }

    if (action === "restore") {
      if (!snapshotId) {
        return NextResponse.json({ error: "snapshotId is required for restore" }, { status: 400 });
      }
      const result = await restoreSnapshot(groupId, snapshotId, user?.id || "staff-member", customMembers);
      return NextResponse.json({
        success: true,
        message: `Snapshot restored: ${result.successCount} ranks updated, ${result.blockedCount} blocked by safety ceiling, ${result.failedCount} failed.`,
        result,
      });
    }

    return NextResponse.json({ error: "Invalid action. Supported: create, preview_restore, restore." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Snapshot operation failed" }, { status: 500 });
  }
}
