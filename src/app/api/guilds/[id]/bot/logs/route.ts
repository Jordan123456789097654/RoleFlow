import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";

export const dynamic = "force-dynamic";

const PAGE = 200;

/**
 * Console lines for a community's bot, oldest first.
 * No `after`: the latest lines. With `after` (an ISO time): only lines newer than that, for live polling.
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "view");
  if (!access.ok) return access.response;

  const after = new URL(request.url).searchParams.get("after");
  const afterDate = after ? new Date(after) : null;
  const validAfter = afterDate && !Number.isNaN(afterDate.getTime()) ? afterDate : null;

  const rows = validAfter
    ? await prisma.botLog.findMany({
        where: { guildId: params.id, createdAt: { gt: validAfter } },
        orderBy: { createdAt: "asc" },
        take: PAGE,
        select: { id: true, level: true, message: true, createdAt: true },
      })
    : (
        await prisma.botLog.findMany({
          where: { guildId: params.id },
          orderBy: { createdAt: "desc" },
          take: PAGE,
          select: { id: true, level: true, message: true, createdAt: true },
        })
      ).reverse();

  return NextResponse.json(
    {
      lines: rows.map((r) => ({ id: r.id, level: r.level, message: r.message, at: r.createdAt.toISOString() })),
      cursor: rows.length ? rows[rows.length - 1].createdAt.toISOString() : validAfter?.toISOString() ?? null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
