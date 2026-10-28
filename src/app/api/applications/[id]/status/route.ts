import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BotDispatcher } from "@/lib/bot-dispatcher";
import { dispatchCommunityWebhook } from "@/lib/webhook-dispatcher";
import { sendApplicationStatusEmail } from "@/lib/email";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const { status, decisionNote } = await request.json();

    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        position: {
          include: { guild: true },
        },
        user: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const updated = await prisma.application.update({
      where: { id: params.id },
      data: {
        status,
        decisionNote: decisionNote || application.decisionNote,
      },
    });

    // 1. Send transactional decision email to applicant if email is available
    if (application.user.email && application.user.emailNotifications !== false) {
      try {
        await sendApplicationStatusEmail({
          toEmail: application.user.email,
          applicantName: application.user.username,
          communityName: application.position.guild.name,
          positionTitle: application.position.title,
          status,
          decisionNote,
          applicationId: application.id,
        });
      } catch (emailErr) {
        console.error("Status update email sending failed:", emailErr);
      }
    }

    // Dispatch bot action (auto-role if accepted, DM to applicant, interview ticket if interview)
    await BotDispatcher.handleStatusChange({
      applicationId: application.id,
      guildId: application.position.guildId,
      applicantDiscordId: application.userId,
      positionTitle: application.position.title,
      newStatus: status,
      decisionNote,
      reviewedByUsername: user?.username || "Staff",
    });

    // Also dispatch status log to community webhook
    await dispatchCommunityWebhook({
      guildId: application.position.guildId,
      event: "STATUS_UPDATE",
      title: `⚖️ Application ${status}: ${application.position.title}`,
      description: `**Applicant:** ${application.user.username} (<@${application.userId}>)\n**Status:** \`${status}\`\n**Reviewed By:** ${user?.username || "Staff Reviewer"}${decisionNote ? `\n**Note:** ${decisionNote}` : ""}`,
    });

    return NextResponse.json({ success: true, application: updated });
  } catch (err) {
    console.error("Status update error:", err);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
