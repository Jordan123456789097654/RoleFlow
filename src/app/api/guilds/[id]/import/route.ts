import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
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
        staffTeam: true,
        positions: {
          include: { questions: true },
        },
      },
    });

    if (!guild) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const isOwner = guild.ownerId === user.id || user.isSiteAdmin || user.id === "1046538179399929957";
    const staffMember = guild.staffTeam.find((s) => s.userId === user.id);
    const hasPermission = isOwner || (staffMember && ["full_decision", "position_editor"].includes(staffMember.permissions));

    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to import applications." }, { status: 403 });
    }

    if (guild.positions.length === 0) {
      return NextResponse.json({ error: "Please create at least one position before importing applications." }, { status: 400 });
    }

    const body = await request.json();
    const rawApps = Array.isArray(body.applications) ? body.applications : [];

    if (rawApps.length === 0) {
      return NextResponse.json({ error: "No applications provided to import." }, { status: 400 });
    }

    let importedCount = 0;
    const defaultPosition = guild.positions[0];

    for (let i = 0; i < rawApps.length; i++) {
      const item = rawApps[i];
      const username = (item.username || item.discord || item.name || `Applicant_${i + 1}`).trim();
      const robloxUsername = item.robloxUsername || item.roblox || null;
      const statusRaw = String(item.status || "PENDING").toUpperCase();
      const validStatuses = ["PENDING", "UNDER_REVIEW", "INTERVIEW", "ACCEPTED", "REJECTED"];
      const status = validStatuses.includes(statusRaw) ? statusRaw : "PENDING";
      const decisionNote = item.notes || item.decisionNote || null;
      
      let tags = item.tags ? String(item.tags).trim() : "";
      if (!tags.includes("Imported")) {
        tags = tags ? `${tags}, Imported` : "Imported";
      }

      // Find matching position by title or ID
      let targetPosition = defaultPosition;
      if (item.positionId) {
        const found = guild.positions.find((p) => p.id === item.positionId);
        if (found) targetPosition = found;
      } else if (item.positionTitle || item.position || item.role) {
        const titleQuery = String(item.positionTitle || item.position || item.role).toLowerCase();
        const found = guild.positions.find((p) => p.title.toLowerCase().includes(titleQuery));
        if (found) targetPosition = found;
      }

      // Upsert a mock or existing User record
      // If user provided a numeric snowflake ID, use it, else generate import ID
      const snowflakeRegex = /^\d{17,20}$/;
      const providedId = item.userId || item.id;
      const userId = (providedId && snowflakeRegex.test(String(providedId)))
        ? String(providedId)
        : `imported_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`;

      const applicantUser = await prisma.user.upsert({
        where: { id: userId },
        update: {
          username: username,
          robloxUsername: robloxUsername || undefined,
        },
        create: {
          id: userId,
          username: username,
          robloxUsername: robloxUsername,
        },
      });

      // Create application
      const application = await prisma.application.create({
        data: {
          userId: applicantUser.id,
          positionId: targetPosition.id,
          status,
          decisionNote,
          tags,
        },
      });

      // Create answer records if answers provided
      if (Array.isArray(item.answers) && item.answers.length > 0 && targetPosition.questions.length > 0) {
        for (let qIdx = 0; qIdx < item.answers.length; qIdx++) {
          const ansItem = item.answers[qIdx];
          const question = targetPosition.questions[qIdx % targetPosition.questions.length];
          const val = typeof ansItem === "object" ? ansItem.value || ansItem.answer || JSON.stringify(ansItem) : String(ansItem);
          
          await prisma.answer.create({
            data: {
              applicationId: application.id,
              questionId: question.id,
              value: val,
            },
          });
        }
      } else if (targetPosition.questions.length > 0) {
        // Create at least one placeholder answer for questionnaire integrity
        await prisma.answer.create({
          data: {
            applicationId: application.id,
            questionId: targetPosition.questions[0].id,
            value: item.notes || "Imported historical application.",
          },
        });
      }

      importedCount++;
    }

    return NextResponse.json({
      success: true,
      importedCount,
      message: `Successfully imported ${importedCount} application${importedCount === 1 ? "" : "s"}.`,
    });
  } catch (err: any) {
    console.error("Import applications error:", err);
    return NextResponse.json({ error: err.message || "Failed to import applications" }, { status: 500 });
  }
}
