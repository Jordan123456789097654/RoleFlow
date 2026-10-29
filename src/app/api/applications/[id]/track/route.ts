import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Returns (creating if needed) the public tracking token for the applicant's own application. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const app = await prisma.application.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true, trackingToken: true },
  });
  if (!app || app.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (app.trackingToken) return NextResponse.json({ token: app.trackingToken });

  const token = randomBytes(16).toString("hex");
  await prisma.application.update({ where: { id: app.id }, data: { trackingToken: token } });
  return NextResponse.json({ token });
}
