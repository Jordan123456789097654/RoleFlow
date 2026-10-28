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
    const userId = cookieStore.get("roleflow_user_id")?.value;

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

    const isOwner = application.position.guild.ownerId === userId;
    const isApplicant = application.userId === userId;
    const isSiteAdmin = userId === "1046538179399929957";

    // Only community owner, applicant themselves, or site admin can delete
    if (!isOwner && !isApplicant && !isSiteAdmin) {
      return NextResponse.json({ error: "Forbidden: Access denied." }, { status: 403 });
    }

    await prisma.application.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Application deleted." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
