import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const ITEMS = ["email", "companyEmail", "robloxLink", "savedProfile", "applicationDrafts", "loginDevices"] as const;
type Item = (typeof ITEMS)[number];

/**
 * Removes one category of personal data from the signed-in user's account without deleting the account.
 * Body: { "item": "email" | "companyEmail" | "robloxLink" | "savedProfile" | "applicationDrafts" | "loginDevices" }
 */
export async function POST(request: Request) {
  const userId = await verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const item = body?.item as Item;
  if (!ITEMS.includes(item)) {
    return NextResponse.json({ error: "Unknown data item." }, { status: 400 });
  }

  switch (item) {
    case "email":
      await prisma.user.update({
        where: { id: userId },
        data: { email: null, emailNotifications: false, emailRemovedAt: new Date() },
      });
      break;
    case "companyEmail":
      await prisma.user.update({
        where: { id: userId },
        data: {
          companyEmail: null,
          pendingCompanyEmail: null,
          companyEmailVerifiedAt: null,
          companyEmailCodeHash: null,
          companyEmailCodeExpiresAt: null,
          companyEmailAttempts: 0,
        },
      });
      break;
    case "robloxLink":
      await prisma.user.update({
        where: { id: userId },
        data: { robloxId: null, robloxUsername: null, robloxAvatar: null },
      });
      break;
    case "savedProfile":
      await prisma.user.update({ where: { id: userId }, data: { savedProfile: null } });
      break;
    case "applicationDrafts":
      await prisma.applicationDraft.deleteMany({ where: { userId } });
      break;
    case "loginDevices":
      await prisma.loginDevice.deleteMany({ where: { userId } });
      break;
  }

  await recordAudit({ actorId: userId, action: "USER_DATA_REMOVE", targetId: userId, details: { item } });
  return NextResponse.json({ success: true, item });
}
