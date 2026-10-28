import { clearSessionCookie } from "@/lib/session-cookie";
import { isFounderId } from "@/lib/roles";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";


/**
 * Permanently deletes the signed-in user's account. Applications, reviews and reset tokens
 * cascade. Requires { "confirm": "DELETE" } in the body to prevent accidental calls.
 */
export async function POST(request: Request) {
  const userId = await verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (body?.confirm !== "DELETE") {
    return NextResponse.json({ error: 'Send {"confirm": "DELETE"} to confirm account deletion.' }, { status: 400 });
  }

  if (isFounderId(userId)) {
    return NextResponse.json({ error: "The Platform Founder account cannot be deleted." }, { status: 400 });
  }

  // Guild ownership is not a foreign key, so deleting would orphan communities.
  const ownedGuilds = await prisma.guild.count({ where: { ownerId: userId } });
  if (ownedGuilds > 0) {
    return NextResponse.json(
      { error: "Transfer or delete the communities you own before deleting your account." },
      { status: 409 }
    );
  }

  await prisma.user.delete({ where: { id: userId } });
  await recordAudit({ actorId: userId, action: "USER_SELF_DELETE", targetId: userId });

  const response = NextResponse.json({ success: true, message: "Your account has been deleted." });
  clearSessionCookie(response);
  return response;
}
