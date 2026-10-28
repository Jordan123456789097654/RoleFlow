import { isFounderId } from "@/lib/roles";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        position: { select: { guildId: true } },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Permission check: applicant, guild staff/owner, or site admin
    const isApplicant = application.userId === user.id;
    const isSiteAdmin = user.isSiteAdmin || isFounderId(user.id);

    let isGuildStaff = false;
    if (!isApplicant && !isSiteAdmin) {
      const guild = await prisma.guild.findUnique({
        where: { id: application.position.guildId },
        include: { staffTeam: true },
      });
      isGuildStaff = guild?.ownerId === user.id || !!guild?.staffTeam.some((s) => s.userId === user.id);
    }

    if (!isApplicant && !isSiteAdmin && !isGuildStaff) {
      return NextResponse.json({ error: "Forbidden: You cannot view messages for this application." }, { status: 403 });
    }

    const messages = await prisma.applicationMessage.findMany({
      where: { applicationId: params.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (err: any) {
    console.error("Fetch messages error:", err);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        position: { select: { guildId: true, title: true } },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const isApplicant = application.userId === user.id;
    const isSiteAdmin = user.isSiteAdmin || isFounderId(user.id);

    let isGuildStaff = false;
    if (!isApplicant && !isSiteAdmin) {
      const guild = await prisma.guild.findUnique({
        where: { id: application.position.guildId },
        include: { staffTeam: true },
      });
      isGuildStaff = guild?.ownerId === user.id || !!guild?.staffTeam.some((s) => s.userId === user.id);
    }

    if (!isApplicant && !isSiteAdmin && !isGuildStaff) {
      return NextResponse.json({ error: "Forbidden: You cannot message on this application." }, { status: 403 });
    }

    const { content } = await request.json();
    if (!content || !String(content).trim()) {
      return NextResponse.json({ error: "Message content cannot be blank" }, { status: 400 });
    }

    const senderRole = isApplicant ? "APPLICANT" : "STAFF";

    const msg = await prisma.applicationMessage.create({
      data: {
        applicationId: params.id,
        senderId: user.id,
        senderName: user.username,
        senderRole,
        content: String(content).trim(),
      },
    });

    return NextResponse.json({ success: true, message: msg });
  } catch (err: any) {
    console.error("Post message error:", err);
    return NextResponse.json({ error: "Failed to post message" }, { status: 500 });
  }
}
