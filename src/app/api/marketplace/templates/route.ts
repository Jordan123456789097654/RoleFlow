import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";
import { recordAudit } from "@/lib/audit";
import { isFeatureEnabled } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

/** Public list of shared position templates, most-imported first. */
export async function GET() {
  if (!(await isFeatureEnabled("marketplace"))) {
    return NextResponse.json({ error: "The marketplace is currently unavailable." }, { status: 404 });
  }
  const templates = await prisma.sharedTemplate.findMany({
    orderBy: [{ importCount: "desc" }, { createdAt: "desc" }],
    take: 50,
    select: { id: true, title: true, description: true, positionTitle: true, department: true, authorName: true, importCount: true, questionsJson: true },
  });
  return NextResponse.json(
    templates.map((t) => ({ ...t, questionCount: JSON.parse(t.questionsJson).length, questionsJson: undefined }))
  );
}

/** Shares one of a community's positions (with its questions) to the marketplace. Owner or site admin only. */
export async function POST(request: Request) {
  const { guildId, positionId, title, description } = await request.json();
  if (!guildId || !positionId) return NextResponse.json({ error: "guildId and positionId are required" }, { status: 400 });

  const access = await authorizeGuild(String(guildId), "manage");
  if (!access.ok) return access.response;

  const position = await prisma.position.findFirst({
    where: { id: positionId, guildId },
    include: { questions: { orderBy: { order: "asc" } }, guild: { select: { name: true } } },
  });
  if (!position) return NextResponse.json({ error: "Position not found in this community" }, { status: 404 });

  const questionsJson = JSON.stringify(
    position.questions.map((q) => ({
      label: q.label,
      type: q.type,
      description: q.description,
      options: q.options,
      required: q.required,
    }))
  );

  const template = await prisma.sharedTemplate.create({
    data: {
      title: String(title || position.title).slice(0, 80),
      description: description ? String(description).slice(0, 500) : null,
      positionTitle: position.title,
      department: position.department,
      positionDescription: position.description,
      questionsJson,
      authorGuildId: guildId,
      authorName: position.guild.name,
    },
  });
  await recordAudit({ actorId: access.userId, action: "TEMPLATE_SHARE", targetId: template.id, details: { guildId, positionId } });
  return NextResponse.json(template);
}
