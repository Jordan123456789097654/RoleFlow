import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";

export const dynamic = "force-dynamic";

const OPEN_STATUSES = ["PENDING", "UNDER_REVIEW", "INTERVIEW"];

/** Open applications per staff member, including staff with none, plus unassigned work. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "view");
  if (!access.ok) return access.response;

  const [staff, open] = await Promise.all([
    prisma.guildStaff.findMany({ where: { guildId: params.id }, select: { userId: true } }),
    prisma.application.findMany({
      where: { position: { guildId: params.id }, status: { in: OPEN_STATUSES }, archivedAt: null },
      select: { assignedReviewerId: true },
    }),
  ]);

  const staffIds = staff.map((s) => s.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: staffIds } },
    select: { id: true, username: true },
  });
  const names = new Map(users.map((u) => [u.id, u.username]));

  const counts = new Map<string, number>();
  let unassigned = 0;
  for (const a of open) {
    if (a.assignedReviewerId) counts.set(a.assignedReviewerId, (counts.get(a.assignedReviewerId) ?? 0) + 1);
    else unassigned++;
  }

  const reviewers = staffIds
    .map((id) => ({ userId: id, username: names.get(id) ?? "Unknown staff", pending: counts.get(id) ?? 0 }))
    .sort((a, b) => b.pending - a.pending);

  return NextResponse.json({ reviewers, unassigned });
}
