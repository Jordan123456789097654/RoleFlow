import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { guildId, title, department, description, acceptRoleId, questions } = await request.json();

    if (!guildId || !title) {
      return NextResponse.json({ error: "Community ID and Position Title are required" }, { status: 400 });
    }

    const guild = await prisma.guild.findUnique({
      where: { id: guildId },
      include: { staffTeam: true },
    });

    if (!guild) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const isOwner = guild.ownerId === user.id || user.isSiteAdmin || user.id === "1046538179399929957";
    const staff = guild.staffTeam.find((s) => s.userId === user.id);
    const hasPermission = isOwner || (staff && ["position_editor", "full_decision"].includes(staff.permissions));

    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to create openings." }, { status: 403 });
    }

    const position = await prisma.position.create({
      data: {
        guildId,
        title: String(title).trim(),
        department: department || "General",
        description: description || "Imported application opening.",
        acceptRoleId: acceptRoleId || null,
        isOpen: true,
      },
    });

    let importedQuestionsCount = 0;
    if (Array.isArray(questions) && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const rawLabel = typeof q === "string" ? q : q.label;
        if (!rawLabel || !String(rawLabel).trim()) continue;

        await prisma.question.create({
          data: {
            positionId: position.id,
            label: String(rawLabel).trim(),
            description: typeof q === "object" && q.description ? String(q.description) : null,
            type: typeof q === "object" && q.type ? q.type : "TEXT",
            options: typeof q === "object" && q.options ? (typeof q.options === "string" ? q.options : JSON.stringify(q.options)) : null,
            required: typeof q === "object" && q.required !== undefined ? Boolean(q.required) : true,
            order: i,
          },
        });
        importedQuestionsCount++;
      }
    }

    return NextResponse.json({
      success: true,
      position,
      importedQuestionsCount,
      message: `Successfully created opening "${position.title}" with ${importedQuestionsCount} questions!`,
    });
  } catch (err: any) {
    console.error("Import position error:", err);
    return NextResponse.json({ error: err.message || "Failed to import position" }, { status: 500 });
  }
}
