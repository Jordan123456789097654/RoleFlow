import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const {
      label,
      description,
      type,
      options,
      required,
      conditionalParentId,
      conditionalValue,
    } = await request.json();

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
        conditionalParentId: conditionalParentId || null,
        conditionalValue: conditionalValue || null,
      },
    });

    return NextResponse.json({ success: true, question });
  } catch (err) {
    console.error("Create question error:", err);
    return NextResponse.json({ error: "Failed to add question" }, { status: 500 });
  }
}

// Reorder questions in bulk
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { questions } = await request.json();

    if (!Array.isArray(questions)) {
      return NextResponse.json({ error: "Questions array required" }, { status: 400 });
    }

    for (const q of questions) {
      if (q.id && typeof q.order === "number") {
        await prisma.question.update({
          where: { id: q.id },
          data: { order: q.order },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reorder questions error:", err);
    return NextResponse.json({ error: "Failed to reorder questions" }, { status: 500 });
  }
}
