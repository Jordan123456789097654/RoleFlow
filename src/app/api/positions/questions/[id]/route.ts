import { authorizeQuestion } from "@/lib/guild-access";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const __a = await authorizeQuestion(params.id, "manage"); if (!__a.ok) return __a.response;
  try {
    const body = await request.json();
    const {
      label,
      description,
      type,
      options,
      required,
      conditionalParentId,
      conditionalValue,
      dependsOnQuestionId: rawDependsOnId,
      dependsOnAnswerValue: rawDependsOnVal,
      order,
    } = body;

    const parentId = rawDependsOnId !== undefined ? (rawDependsOnId || null) : (conditionalParentId !== undefined ? (conditionalParentId || null) : undefined);
    const triggerVal = rawDependsOnVal !== undefined ? (rawDependsOnVal || null) : (conditionalValue !== undefined ? (conditionalValue || null) : undefined);

    const updated = await prisma.question.update({
      where: { id: params.id },
      data: {
        ...(label ? { label: label.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(type ? { type } : {}),
        ...(options !== undefined ? { options: typeof options === "string" ? options : JSON.stringify(options) } : {}),
        ...(required !== undefined ? { required: Boolean(required) } : {}),
        ...(order !== undefined ? { order: Number(order) } : {}),
        ...(parentId !== undefined ? { dependsOnQuestionId: parentId, conditionalParentId: parentId } : {}),
        ...(triggerVal !== undefined ? { dependsOnAnswerValue: triggerVal, conditionalValue: triggerVal } : {}),
      },
    });

    return NextResponse.json({ success: true, question: updated });
  } catch (err) {
    console.error("Update question error:", err);
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const __a = await authorizeQuestion(params.id, "manage"); if (!__a.ok) return __a.response;
  try {
    await prisma.question.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete question error:", err);
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
