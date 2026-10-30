import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { getSupportCaller } from "@/lib/staff-access";
import { isFounderId, isSiteAdminUser } from "@/lib/roles";

export const dynamic = "force-dynamic";

/** Actions support staff can take on an account. Each one needs a reason and writes a removal-log row when data is removed. */
const SUPPORT_ACTIONS: Record<string, { item?: string; label: string }> = {
  revokeSessions: { label: "Sign out every session" },
  removeEmail: { item: "email", label: "Remove email address" },
  removeCompanyEmail: { item: "companyEmail", label: "Remove company email" },
  removeRobloxLink: { item: "robloxLink", label: "Remove Roblox link" },
  removeSavedProfile: { item: "savedProfile", label: "Remove saved profile answers" },
  removeDrafts: { item: "applicationDrafts", label: "Remove server drafts" },
  removeLoginDevices: { item: "loginDevices", label: "Remove recorded devices" },
  deleteApplications: { item: "applications", label: "Delete applications this user submitted" },
  deleteReviews: { item: "reviews", label: "Delete reviews this user wrote" },
  deleteSavedPositions: { item: "savedPositions", label: "Delete saved positions" },
  deleteFeedback: { item: "feedback", label: "Delete feedback this user filed" },
};
const ADMIN_ACTIONS: Record<string, { item?: string; label: string }> = {
  removeApplicationMessages: { item: "applicationMessages", label: "Remove messages sent on applications" },
  resetTwoFactor: { label: "Reset two-factor authentication" },
  deleteAccount: { item: "account", label: "Delete account permanently" },
};

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const caller = await getSupportCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const action = String(body?.action ?? "");
  const reason = String(body?.reason ?? "").trim();
  const ticketRef = body?.ticketRef ? String(body.ticketRef).trim().slice(0, 100) : null;

  const isSupport = action in SUPPORT_ACTIONS;
  const isAdmin = action in ADMIN_ACTIONS;
  if (!isSupport && !isAdmin) return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  if (isAdmin && !caller.isAdmin) return NextResponse.json({ error: "Only site admins can do this." }, { status: 403 });
  if (reason.length < 10) return NextResponse.json({ error: "Give a reason of at least 10 characters. It is kept in the removal log." }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true, username: true, isSiteAdmin: true, siteRole: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (isFounderId(target.id)) return NextResponse.json({ error: "The founder account cannot be changed from here." }, { status: 403 });
  if (isSiteAdminUser(target) && !caller.isFounder) return NextResponse.json({ error: "Only the founder can act on admin accounts." }, { status: 403 });
  if (target.id === caller.id && isAdmin) return NextResponse.json({ error: "Use Settings to change your own account." }, { status: 400 });

  const def = isSupport ? SUPPORT_ACTIONS[action] : ADMIN_ACTIONS[action];
  let removed: number | null = null;

  switch (action) {
    case "revokeSessions":
      await prisma.user.update({ where: { id: target.id }, data: { sessionVersion: { increment: 1 } } });
      break;
    case "removeEmail":
      await prisma.user.update({ where: { id: target.id }, data: { email: null, emailNotifications: false, emailRemovedAt: new Date() } });
      break;
    case "removeCompanyEmail":
      await prisma.user.update({
        where: { id: target.id },
        data: { companyEmail: null, pendingCompanyEmail: null, companyEmailVerifiedAt: null, companyEmailCodeHash: null, companyEmailCodeExpiresAt: null, companyEmailAttempts: 0 },
      });
      break;
    case "removeRobloxLink":
      await prisma.user.update({ where: { id: target.id }, data: { robloxId: null, robloxUsername: null, robloxAvatar: null } });
      break;
    case "removeSavedProfile":
      await prisma.user.update({ where: { id: target.id }, data: { savedProfile: null } });
      break;
    case "removeDrafts":
      await prisma.applicationDraft.deleteMany({ where: { userId: target.id } });
      break;
    case "removeLoginDevices":
      await prisma.loginDevice.deleteMany({ where: { userId: target.id } });
      break;
    case "deleteApplications": {
      // Deleting an application also removes its answers, reviews, and messages (cascade).
      const r = await prisma.application.deleteMany({ where: { userId: target.id } });
      removed = r.count;
      break;
    }
    case "deleteReviews": {
      const [a, b] = await Promise.all([
        prisma.review.deleteMany({ where: { reviewerId: target.id } }),
        prisma.communityReview.deleteMany({ where: { userId: target.id } }),
      ]);
      removed = a.count + b.count;
      break;
    }
    case "deleteSavedPositions": {
      const r = await prisma.savedPosition.deleteMany({ where: { userId: target.id } });
      removed = r.count;
      break;
    }
    case "deleteFeedback": {
      const r = await prisma.feedbackReport.deleteMany({ where: { authorId: target.id } });
      removed = r.count;
      break;
    }
    case "removeApplicationMessages":
      await prisma.applicationMessage.deleteMany({ where: { senderId: target.id } });
      break;
    case "resetTwoFactor":
      await prisma.user.update({
        where: { id: target.id },
        data: { totpEnabled: false, totpSecret: null, totpRecoveryCodes: null, sessionVersion: { increment: 1 } },
      });
      break;
    case "deleteAccount": {
      const owned = await prisma.guild.count({ where: { ownerId: target.id } });
      if (owned > 0) return NextResponse.json({ error: "This user owns communities. Transfer or delete them first." }, { status: 409 });
      await prisma.user.delete({ where: { id: target.id } });
      break;
    }
  }

  // Removal-log row for anything that removed personal data.
  if (def.item) {
    await prisma.dataRemovalLog.create({
      data: {
        subjectUserId: target.id,
        subjectUsername: target.username,
        item: def.item,
        method: isAdmin ? "ADMIN_MANUAL" : "SUPPORT_MANUAL",
        reason,
        ticketRef,
        actorId: caller.id,
        actorName: caller.username,
      },
    });
  }

  await recordAudit({
    actorId: caller.id,
    action: `SUPPORT_${action.replace(/[A-Z]/g, (c) => "_" + c).toUpperCase()}`,
    targetId: target.id,
    details: { reason, ticketRef, label: def.label },
  });
  return NextResponse.json({ success: true, action: def.label, removed });
}
