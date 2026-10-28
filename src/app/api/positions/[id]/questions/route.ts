import { authorizePosition } from "@/lib/guild-access";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const __a = await authorizePosition(params.id, "manage"); if (!__a.ok) return __a.response;
  try {
    const body = await request.json();

    // Check for bulk import of questions
    if (Array.isArray(body.questions) && body.questions.length > 0) {
      const lastQuestion = await prisma.question.findFirst({
        where: { positionId: params.id },
        orderBy: { order: "desc" },
      });
      let nextOrder = (lastQuestion?.order ?? -1) + 1;

      const createdQuestions = [];
      for (const q of body.questions) {
        const rawLabel = typeof q === "string" ? q : q.label;
        if (!rawLabel || !String(rawLabel).trim()) continue;
        const label = String(rawLabel).trim();
        const type = typeof q === "object" && q.type ? q.type : "TEXT";
        const description = typeof q === "object" && q.description ? String(q.description) : null;
        const options = typeof q === "object" && q.options ? (typeof q.options === "string" ? q.options : JSON.stringify(q.options)) : null;
        const required = typeof q === "object" && q.required !== undefined ? Boolean(q.required) : true;

        const dependsOnQuestionId = (typeof q === "object" && (q.dependsOnQuestionId || q.conditionalParentId)) ? String(q.dependsOnQuestionId || q.conditionalParentId) : null;
        const dependsOnAnswerValue = (typeof q === "object" && (q.dependsOnAnswerValue || q.conditionalValue)) ? String(q.dependsOnAnswerValue || q.conditionalValue) : null;

        const created = await prisma.question.create({
          data: {
            positionId: params.id,
            label,
            description,
            type,
            options,
            required,
            order: nextOrder++,
            conditionalParentId: dependsOnQuestionId,
            conditionalValue: dependsOnAnswerValue,
            dependsOnQuestionId,
            dependsOnAnswerValue,
          },
        });
        createdQuestions.push(created);
      }

      return NextResponse.json({
        success: true,
        count: createdQuestions.length,
        questions: createdQuestions,
        message: `Successfully imported ${createdQuestions.length} questions!`,
      });
    }

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
    } = body;

    const parentId = rawDependsOnId !== undefined ? (rawDependsOnId || null) : (conditionalParentId || null);
    const triggerVal = rawDependsOnVal !== undefined ? (rawDependsOnVal || null) : (conditionalValue || null);

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
        conditionalParentId: parentId,
        conditionalValue: triggerVal,
        dependsOnQuestionId: parentId,
        dependsOnAnswerValue: triggerVal,
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
  const __a = await authorizePosition(params.id, "manage"); if (!__a.ok) return __a.response;
  try {
    const { questions } = await request.json(); // Array of { id, order }

    if (!Array.isArray(questions)) {
      return NextResponse.json({ error: "Invalid questions array" }, { status: 400 });
    }

    await prisma.$transaction(
      questions.map((q) =>
        prisma.question.update({
          where: { id: q.id },
          data: { order: q.order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reorder questions error:", err);
    return NextResponse.json({ error: "Failed to reorder questions" }, { status: 500 });
  }
}
