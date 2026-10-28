import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latestOnly = searchParams.get("latest") === "true";

    if (latestOnly) {
      const latest = await prisma.changelog.findFirst({
        where: { isPublished: true },
        orderBy: { publishedAt: "desc" },
      });
      return NextResponse.json({ latest });
    }

    const changelogs = await prisma.changelog.findMany({
      orderBy: { publishedAt: "desc" },
    });

    return NextResponse.json(changelogs);
  } catch (err) {
    console.error("Fetch changelog error:", err);
    return NextResponse.json({ error: "Failed to fetch update logs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("roleflow_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isFounder = currentUser?.isSiteAdmin || currentUser?.id === "1046538179399929957";

    if (!isFounder) {
      return NextResponse.json({ error: "Forbidden: Founder access required" }, { status: 403 });
    }

    const { version, title, content, tag } = await request.json();

    if (!version || !title || !content) {
      return NextResponse.json({ error: "Version, title, and content are required" }, { status: 400 });
    }

    const changelog = await prisma.changelog.create({
      data: {
        version: version.trim(),
        title: title.trim(),
        content: content.trim(),
        tag: tag || "FEATURE",
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, changelog });
  } catch (err) {
    console.error("Create changelog error:", err);
    return NextResponse.json({ error: "Failed to broadcast update log" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("roleflow_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isFounder = currentUser?.isSiteAdmin || currentUser?.id === "1046538179399929957";

    if (!isFounder) {
      return NextResponse.json({ error: "Forbidden: Founder access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.changelog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete changelog error:", err);
    return NextResponse.json({ error: "Failed to delete update log" }, { status: 500 });
  }
}
