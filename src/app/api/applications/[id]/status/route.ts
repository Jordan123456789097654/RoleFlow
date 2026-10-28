import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";
import { changeApplicationStatus, STATUSES } from "@/lib/application-status";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { status, decisionNote } = await request.json();
    if (!STATUSES.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    const application = await prisma.application.findUnique({
      where: { id: params.id },
      select: { position: { select: { guildId: true } } },
    });
    if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

    const access = await authorizeGuild(application.position.guildId, "decide");
    if (!access.ok) return access.response;

    const updated = await changeApplicationStatus({
      applicationId: params.id,
      status,
      decisionNote,
      actorId: user.id,
      actorName: user.username,
    });
    return NextResponse.json({ success: true, application: updated });
  } catch (err) {
    console.error("Status update error:", err);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
