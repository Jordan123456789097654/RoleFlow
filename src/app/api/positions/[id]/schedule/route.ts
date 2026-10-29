import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizePosition } from "@/lib/guild-access";

export const dynamic = "force-dynamic";

function parseDate(v: unknown): Date | null | "invalid" {
  if (v === null || v === "" || v === undefined) return null;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? "invalid" : d;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const access = await authorizePosition(params.id, "manage");
  if (!access.ok) return access.response;

  const body = await request.json().catch(() => ({}));
  const opensAt = parseDate(body.opensAt);
  const closesAt = parseDate(body.closesAt);
  if (opensAt === "invalid" || closesAt === "invalid") {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }
  if (opensAt && closesAt && closesAt <= opensAt) {
    return NextResponse.json({ error: "The closing time must be after the opening time." }, { status: 400 });
  }

  let maxApplications: number | null = null;
  if (body.maxApplications !== null && body.maxApplications !== "" && body.maxApplications !== undefined) {
    const n = Number(body.maxApplications);
    if (!Number.isInteger(n) || n < 1 || n > 10000) {
      return NextResponse.json({ error: "Application cap must be a whole number from 1 to 10000." }, { status: 400 });
    }
    maxApplications = n;
  }

  await prisma.position.update({
    where: { id: params.id },
    data: { opensAt, closesAt, maxApplications, waitlistEnabled: Boolean(body.waitlistEnabled) && maxApplications !== null },
  });
  return NextResponse.json({ success: true });
}
