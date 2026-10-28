import { authorizeQuestion } from "@/lib/guild-access";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
