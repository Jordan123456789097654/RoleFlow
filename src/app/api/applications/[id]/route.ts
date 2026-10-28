import { recordAudit } from "@/lib/audit";
import { verifySessionValue } from "@/lib/session";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const userId = await verifySessionValue(cookieStore.get("roleflow_user_id")?.value);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        position: {
          include: { guild: true },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isOwner = application.position.guild.ownerId === userId;
    const isApplicant = application.userId === userId;
    const isSiteAdmin = currentUser?.isSiteAdmin || userId === "1046538179399929957";

    let isStaff = false;
    if (!isOwner && !isApplicant && !isSiteAdmin) {
      const staffMember = await prisma.guildStaff.findUnique({
        where: {
          guildId_userId: {
            guildId: application.position.guildId,
            userId,
          },
        },
      });
      isStaff = staffMember ? ["full_decision", "position_editor"].includes(staffMember.permissions) : false;
    }

    if (!isOwner && !isApplicant && !isSiteAdmin && !isStaff) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to delete this application." }, { status: 403 });
    }

    await prisma.answer.deleteMany({ where: { applicationId: params.id } });
    await prisma.review.deleteMany({ where: { applicationId: params.id } });
    await prisma.applicationMessage.deleteMany({ where: { applicationId: params.id } });
    await prisma.application.delete({ where: { id: params.id } });

    await recordAudit({ actorId: userId, action: "APPLICATION_DELETE", targetId: params.id });
    return NextResponse.json({ success: true, message: "Application deleted." });
  } catch (err: any) {
    console.error("Delete application error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete application" }, { status: 500 });
  }
}
