import { clearSessionCookie } from "@/lib/session-cookie";
import { isFounderId } from "@/lib/roles";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue, SESSION_COOKIE_NAME } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Permanently deletes the signed-in user's account and purges everything across products,
 * including user records, audit logs, support reports/logs, drafts, and data-removal logs.
 * Requires { "confirm": "DELETE" } in the body.
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

  // Purge all records across products in a single database transaction
  await prisma.$transaction([
    // Delete non-cascading user records
    prisma.savedPosition.deleteMany({ where: { userId } }),
    prisma.applicationDraft.deleteMany({ where: { userId } }),
    prisma.pollVote.deleteMany({ where: { userId } }),
    prisma.contentReport.deleteMany({ where: { reporterId: userId } }),
    prisma.feedbackReport.deleteMany({ where: { authorId: userId } }),

    // Purge audit, data-removal, and support logs where user was actor or target
    prisma.auditLog.deleteMany({
      where: {
        OR: [{ actorId: userId }, { targetId: userId }],
      },
    }),
    prisma.dataRemovalLog.deleteMany({
      where: {
        OR: [{ subjectUserId: userId }, { actorId: userId }],
      },
    }),
    prisma.supportReport.deleteMany({
      where: {
        OR: [{ subjectUserId: userId }, { authorId: userId }],
      },
    }),

    // Finally delete user record (cascades applications, reviews, reset tokens, login devices)
    prisma.user.delete({ where: { id: userId } }),
  ]);

  const response = NextResponse.json({ success: true, message: "Your account and all associated data have been permanently purged." });
  clearSessionCookie(response);
  return response;
}
