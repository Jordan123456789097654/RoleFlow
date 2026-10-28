import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { BotDispatcher } from "@/lib/bot-dispatcher";
import { dispatchCommunityWebhook } from "@/lib/webhook-dispatcher";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { guildId, applicationIds, action, decisionNote, tag } = await request.json();

    if (!guildId || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return NextResponse.json({ error: "guildId and non-empty applicationIds array required" }, { status: 400 });
    }

    // Verify community permissions
    const guild = await prisma.guild.findUnique({
      where: { id: guildId },
      include: { staffTeam: true },
    });

    if (!guild) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const isOwner = guild.ownerId === user.id || user.isSiteAdmin || user.id === "1046538179399929957";
    const staffMember = guild.staffTeam.find((s) => s.userId === user.id);
    const hasFullDecision = staffMember && (staffMember.permissions === "full_decision" || staffMember.permissions === "position_editor");

    if (!isOwner && !hasFullDecision) {
      return NextResponse.json({ error: "Forbidden: Full decision permissions required for bulk actions." }, { status: 403 });
    }

    // Process Batch Actions
    if (action === "DELETE") {
      await prisma.answer.deleteMany({
        where: { applicationId: { in: applicationIds } },
      });
      await prisma.review.deleteMany({
        where: { applicationId: { in: applicationIds } },
      });
      await prisma.applicationMessage.deleteMany({
        where: { applicationId: { in: applicationIds } },
      });
      const deleted = await prisma.application.deleteMany({
        where: { id: { in: applicationIds } },
      });

      return NextResponse.json({
        success: true,
        message: `Permanently deleted ${deleted.count} application(s).`,
        processedCount: deleted.count,
      });
    }

    if (action === "ACCEPT" || action === "REJECT") {
      const newStatus = action === "ACCEPT" ? "ACCEPTED" : "REJECTED";

      const apps = await prisma.application.findMany({
        where: { id: { in: applicationIds } },
        include: { position: true, user: true },
      });

      // Update statuses in database
      await prisma.application.updateMany({
        where: { id: { in: applicationIds } },
        data: {
          status: newStatus,
          decisionNote: decisionNote || `Batch ${newStatus.toLowerCase()} by ${user.username}`,
        },
      });

      // Dispatch bot actions & webhooks asynchronously
      for (const app of apps) {
        BotDispatcher.handleStatusChange({
          applicationId: app.id,
          guildId: app.position.guildId,
          applicantDiscordId: app.userId,
          positionTitle: app.position.title,
          newStatus,
          decisionNote: decisionNote || `Batch ${newStatus.toLowerCase()} by ${user.username}`,
          reviewedByUsername: user.username,
        }).catch((e) => console.warn("Bot batch dispatch err:", e));
      }

      await dispatchCommunityWebhook({
        guildId,
        event: "STATUS_UPDATE",
        title: `📥 Batch Application Action: ${apps.length} ${newStatus}`,
        description: `**Reviewer:** ${user.username}\n**Affected Applicants:** ${apps.map((a) => a.user.username).join(", ")}`,
      });

      return NextResponse.json({
        success: true,
        message: `Successfully updated ${apps.length} applications to ${newStatus}.`,
        processedCount: apps.length,
        count: apps.length,
      });
    }

    if (action === "TAG" && tag) {
      // Add tag to all selected applications
      const apps = await prisma.application.findMany({
        where: { id: { in: applicationIds } },
        select: { id: true, tags: true },
      });

      for (const app of apps) {
        const currentTags = app.tags ? app.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
        if (!currentTags.includes(tag.trim())) {
          currentTags.push(tag.trim());
          await prisma.application.update({
            where: { id: app.id },
            data: { tags: currentTags.join(",") },
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Added tag "${tag}" to ${apps.length} applications.`,
        processedCount: apps.length,
      });
    }

    return NextResponse.json({ error: "Unsupported bulk action" }, { status: 400 });
  } catch (err: any) {
    console.error("Bulk action error:", err);
    return NextResponse.json({ error: err.message || "Failed to execute bulk action" }, { status: 500 });
  }
}
