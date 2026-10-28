import { authorizeGuild } from "@/lib/guild-access";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const __a = await authorizeGuild(params.id, "decide"); if (!__a.ok) return __a.response;
  try {
    const guild = await prisma.guild.findUnique({
      where: { id: params.id },
      include: {
        positions: {
          include: {
            questions: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    if (!guild) {
      return new NextResponse("Guild not found", { status: 404 });
    }

    const applications = await prisma.application.findMany({
      where: {
        position: { guildId: params.id },
      },
      include: {
        user: true,
        position: true,
        answers: {
          include: { question: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Generate CSV Header
    const headers = [
      "Application ID",
      "Position Title",
      "Applicant Username",
      "Discord ID",
      "Roblox Username",
      "Status",
      "Decision Note",
      "Submitted At",
      "Responses Summary",
    ];

    const escapeCsv = (str: string | null | undefined) => {
      if (!str) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = applications.map((app) => {
      const summaryAnswers = app.answers
        .map((a) => `[${a.question.label}]: ${a.value}`)
        .join(" | ");

      return [
        escapeCsv(app.id),
        escapeCsv(app.position.title),
        escapeCsv(app.user.username),
        escapeCsv(app.user.id),
        escapeCsv(app.user.robloxUsername || "N/A"),
        escapeCsv(app.status),
        escapeCsv(app.decisionNote || ""),
        escapeCsv(app.createdAt.toISOString()),
        escapeCsv(summaryAnswers),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${guild.name.replace(/[^a-zA-Z0-9]/g, "_")}_applications.csv"`,
      },
    });
  } catch (err) {
    console.error("Export CSV error:", err);
    return new NextResponse("Failed to export data", { status: 500 });
  }
}
