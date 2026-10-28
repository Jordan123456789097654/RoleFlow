import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";

export const dynamic = "force-dynamic";

const TYPES = ["ACCEPT", "REJECT", "ANY"];

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "view");
  if (!access.ok) return access.response;
  const replies = await prisma.cannedResponse.findMany({
    where: { guildId: params.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(replies);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "decide");
  if (!access.ok) return access.response;

  const { title, content, type } = await request.json();
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "A title and content are required." }, { status: 400 });
  }
  if (String(title).length > 80 || String(content).length > 2000) {
    return NextResponse.json({ error: "Title must be 80 characters or fewer; content 2000." }, { status: 400 });
  }
  const replyType = TYPES.includes(type) ? type : "ANY";

  const reply = await prisma.cannedResponse.create({
    data: { guildId: params.id, title: String(title).trim(), content: String(content), type: replyType },
  });
  return NextResponse.json(reply);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const replyId = new URL(request.url).searchParams.get("replyId");
  if (!replyId) return NextResponse.json({ error: "replyId is required" }, { status: 400 });

  const reply = await prisma.cannedResponse.findUnique({ where: { id: replyId }, select: { guildId: true } });
  if (!reply || reply.guildId !== params.id) return NextResponse.json({ error: "Reply not found" }, { status: 404 });

  const access = await authorizeGuild(params.id, "decide");
  if (!access.ok) return access.response;

  await prisma.cannedResponse.delete({ where: { id: replyId } });
  return NextResponse.json({ success: true });
}
