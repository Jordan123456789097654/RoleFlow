import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BotDispatcher } from "@/lib/bot-dispatcher";
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
        position: true,
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

    // Dispatch bot action (auto-role if accepted, DM to applicant, interview ticket if interview)
    await BotDispatcher.handleStatusChange({
      applicationId: application.id,
      guildId: application.position.guildId,
      applicantDiscordId: application.userId,
      positionTitle: application.position.title,
      newStatus: status,
      decisionNote,
      reviewedByUsername: user.username,
    });

    return NextResponse.json({ success: true, application: updated });
  } catch (err) {
    console.error("Status update error:", err);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
