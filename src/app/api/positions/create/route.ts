import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { guildId, title, department, description, acceptRoleId, isPublic } = await request.json();

    if (!guildId || !title || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const position = await prisma.position.create({
      data: {
        guildId,
        title,
        department: department || "General",
        description,
        acceptRoleId: acceptRoleId || null,
        isPublic: isPublic ?? true,
        isOpen: true,
      },
    });

    return NextResponse.json({ success: true, position });
  } catch (err) {
    console.error("Create position error:", err);
    return NextResponse.json({ error: "Failed to create position" }, { status: 500 });
  }
}
