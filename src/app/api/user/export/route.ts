import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue, SESSION_COOKIE_NAME } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Downloads everything RoleFlow stores about the signed-in user (GDPR/privacy-policy export). */
export async function GET() {
  const userId = await verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user, applications, messages, reviews] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        discriminator: true,
        email: true,
        emailNotifications: true,
        robloxId: true,
        robloxUsername: true,
        plan: true,
        createdAt: true,
      },
    }),
    prisma.application.findMany({ where: { userId } }),
    prisma.applicationMessage.findMany({ where: { senderId: userId } }),
    prisma.review.findMany({ where: { reviewerId: userId } }),
  ]);

  const body = JSON.stringify(
    { exportedAt: new Date().toISOString(), user, applications, messages, reviews },
    null,
    2
  );

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="roleflow-data-${userId}.json"`,
    },
  });
}
