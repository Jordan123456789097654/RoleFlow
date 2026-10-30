import { isFounderId } from "@/lib/roles";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendApplicationStatusEmail } from "@/lib/email";
import { decryptSecret } from "@/lib/crypto";
import { setGroupMemberRank } from "@/lib/roblox";
import { recordAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { guildId, applicationIds, action, decisionNote, tag, reviewerId, reviewDueAt, needsSecondOpinion } = await request.json();

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

    const isOwner = guild.ownerId === user.id || user.isSiteAdmin || isFounderId(user.id);
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

      // Dispatch emails, bot actions & webhooks asynchronously
      for (const app of apps) {
        if (app.user.email && app.user.emailNotifications !== false) {
          sendApplicationStatusEmail({
            toEmail: app.user.email,
            applicantName: app.user.username,
            communityName: guild.name,
            positionTitle: app.position.title,
            status: newStatus,
            decisionNote: decisionNote || `Batch ${newStatus.toLowerCase()} by ${user.username}`,
            applicationId: app.id,
          }).catch((e) => console.warn("Batch status email error:", e));
        }


        // Roblox Open Cloud Auto-Ranking on ACCEPTED
        if (newStatus === "ACCEPTED" && guild.robloxCloudApiKey && guild.robloxGroupId && guild.robloxAcceptRankId && app.user.robloxId) {
          try {
            const decryptedKey = decryptSecret(guild.robloxCloudApiKey);
            if (decryptedKey) {
              setGroupMemberRank(
                guild.robloxGroupId,
                app.user.robloxId,
                guild.robloxAcceptRankId,
                decryptedKey
              ).then((rankResult) => {
                if (rankResult.success) {
                  logger.info(`Batch auto-ranked applicant ${app.user.username} (Roblox: ${app.user.robloxId}) in group ${guild.robloxGroupId}`);
                  recordAudit({
                    actorId: user.id,
                    action: "ROBLOX_AUTO_RANK_SUCCESS",
                    targetId: app.id,
                    details: {
                      guildId: guild.id,
                      robloxGroupId: guild.robloxGroupId,
                      robloxUserId: app.user.robloxId,
                      targetRank: guild.robloxAcceptRankId,
                      roleId: rankResult.roleId,
                      via: "bulk",
                    },
                  }).catch(() => {});
                } else {
                  logger.warn(`Batch auto-ranking failed for ${app.user.username}: ${rankResult.error}`);
                  recordAudit({
                    actorId: user.id,
                    action: "ROBLOX_AUTO_RANK_FAILURE",
                    targetId: app.id,
                    details: {
                      guildId: guild.id,
                      robloxGroupId: guild.robloxGroupId,
                      robloxUserId: app.user.robloxId,
                      targetRank: guild.robloxAcceptRankId,
                      error: rankResult.error,
                      via: "bulk",
                    },
                  }).catch(() => {});
                }
              }).catch((e) => console.warn("Batch auto-rank error:", e));
            }
          } catch (robloxErr) {
            console.warn("Roblox batch ranking setup error:", robloxErr);
          }
        }
      }


      return NextResponse.json({
        success: true,
        message: `Successfully updated ${apps.length} applications to ${newStatus}.`,
        processedCount: apps.length,
        count: apps.length,
      });
    }

    if (action === "ASSIGN") {
      if (reviewerId && guild.ownerId !== reviewerId && !guild.staffTeam.some((s) => s.userId === reviewerId)) {
        return NextResponse.json({ error: "Reviewers must be the owner or a member of the staff team." }, { status: 400 });
      }
      const result = await prisma.application.updateMany({
        where: { id: { in: applicationIds.map(String) }, position: { guildId } },
        data: {
          assignedReviewerId: reviewerId || null,
          reviewDueAt: reviewDueAt ? new Date(reviewDueAt) : null,
          ...(typeof needsSecondOpinion === "boolean" ? { needsSecondOpinion } : {}),
        },
      });
      return NextResponse.json({ success: true, updated: result.count });
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
    return NextResponse.json({ error: "Failed to execute bulk action" }, { status: 500 });
  }
}
