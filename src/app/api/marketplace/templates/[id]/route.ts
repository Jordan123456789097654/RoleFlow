import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** Removes a shared template. Only the community that published it can do this. */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const template = await prisma.sharedTemplate.findUnique({ where: { id: params.id }, select: { authorGuildId: true } });
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  const access = await authorizeGuild(template.authorGuildId, "manage");
  if (!access.ok) return access.response;

  await prisma.sharedTemplate.delete({ where: { id: params.id } });
  await recordAudit({ actorId: access.userId, action: "TEMPLATE_UNSHARE", targetId: params.id });
  return NextResponse.json({ success: true });
}
