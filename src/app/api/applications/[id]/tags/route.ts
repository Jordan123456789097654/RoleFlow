import { isFounderId } from "@/lib/roles";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
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
      include: { position: { select: { guildId: true } } },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Verify staff or owner permissions
    const guild = await prisma.guild.findUnique({
      where: { id: application.position.guildId },
      include: { staffTeam: true },
    });

    const isOwner = guild?.ownerId === user.id || user.isSiteAdmin || isFounderId(user.id);
    const isStaff = guild?.staffTeam.some((s) => s.userId === user.id);

    if (!isOwner && !isStaff) {
      return NextResponse.json({ error: "Forbidden: Staff permission required" }, { status: 403 });
    }

    const { tag, action } = await request.json(); // action: "ADD" | "REMOVE" | "SET", tag: string
    const currentTags = application.tags ? application.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

    let newTags = currentTags;
    if (action === "ADD" && tag) {
      if (!newTags.includes(tag)) newTags.push(tag);
    } else if (action === "REMOVE" && tag) {
      newTags = newTags.filter((t) => t !== tag);
    } else if (action === "SET" && Array.isArray(tag)) {
      newTags = tag;
    } else if (tag) {
      // Toggle
      if (newTags.includes(tag)) {
        newTags = newTags.filter((t) => t !== tag);
      } else {
        newTags.push(tag);
      }
    }

    const updated = await prisma.application.update({
      where: { id: params.id },
      data: { tags: newTags.join(",") },
    });

    return NextResponse.json({ success: true, tags: newTags, application: updated });
  } catch (err: any) {
    console.error("Tag update error:", err);
    return NextResponse.json({ error: "Failed to update tags" }, { status: 500 });
  }
}
