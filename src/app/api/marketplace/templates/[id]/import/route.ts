import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** Copies a shared template into one of the caller's communities as a new open position. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { guildId } = await request.json();
  if (!guildId) return NextResponse.json({ error: "guildId is required" }, { status: 400 });

  const access = await authorizeGuild(String(guildId), "manage");
  if (!access.ok) return access.response;

  const template = await prisma.sharedTemplate.findUnique({ where: { id: params.id } });
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const questions: Array<{ label: string; type: string; description?: string | null; options?: string | null; required?: boolean }> =
    JSON.parse(template.questionsJson);

  const position = await prisma.position.create({
    data: {
      guildId: String(guildId),
      title: template.positionTitle,
      department: template.department,
      description: template.positionDescription || "",
      isOpen: true,
      isPublic: true,
      questions: {
        create: questions.map((q, i) => ({
          label: q.label,
          type: q.type,
          description: q.description ?? null,
          options: q.options ?? null,
          required: q.required ?? true,
          order: i,
        })),
      },
    },
  });

  await prisma.sharedTemplate.update({ where: { id: params.id }, data: { importCount: { increment: 1 } } });
  await recordAudit({ actorId: access.userId, action: "TEMPLATE_IMPORT", targetId: params.id, details: { guildId, positionId: position.id } });
  return NextResponse.json({ success: true, positionId: position.id });
}
