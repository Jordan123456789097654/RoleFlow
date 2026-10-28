import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { label, description, type, options, required } = await request.json();

    if (!label || !type) {
      return NextResponse.json({ error: "Label and question type are required" }, { status: 400 });
    }

    // Get current max order
    const lastQuestion = await prisma.question.findFirst({
      where: { positionId: params.id },
      orderBy: { order: "desc" },
    });

    const newOrder = (lastQuestion?.order ?? -1) + 1;

    const question = await prisma.question.create({
      data: {
        positionId: params.id,
        label,
        description: description || null,
        type,
        options: options ? (typeof options === "string" ? options : JSON.stringify(options)) : null,
        required: Boolean(required),
        order: newOrder,
      },
    });

    return NextResponse.json({ success: true, question });
  } catch (err) {
    console.error("Create question error:", err);
    return NextResponse.json({ error: "Failed to add question" }, { status: 500 });
  }
}
