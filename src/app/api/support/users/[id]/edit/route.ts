import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { getSupportCaller } from "@/lib/staff-access";
import { isFounderId, isSiteAdminUser } from "@/lib/roles";
import { sendSecurityNoticeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[\p{L}\p{N} _.\-]+$/u;

/**
 * Support staff edits to an account. Every edit needs a reason, is written to the audit log,
 * and sends a security notice to the address on file (both addresses when the email changes).
 * Allowed fields: username, email, and unlinkRoblox (clearing a Roblox link only; linking needs Roblox verification).
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const caller = await getSupportCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const field = String(body?.field ?? "");
  const reason = String(body?.reason ?? "").trim().slice(0, 1000);
  const ticketRef = body?.ticketRef ? String(body.ticketRef).trim().slice(0, 100) : null;
  if (reason.length < 10) return NextResponse.json({ error: "Give a reason of at least 10 characters. It is kept in the audit log." }, { status: 400 });

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, username: true, email: true, robloxId: true, robloxUsername: true, isSiteAdmin: true, siteRole: true, isBanned: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (isFounderId(target.id)) return NextResponse.json({ error: "The founder account cannot be changed from here." }, { status: 403 });
  if (isSiteAdminUser(target) && !caller.isFounder) return NextResponse.json({ error: "Only the founder can act on admin accounts." }, { status: 403 });
  if (target.id === caller.id) return NextResponse.json({ error: "Use Settings to change your own account." }, { status: 400 });

  let data: Record<string, unknown> = {};
  let before = "";
  let after = "";
  let notify: { to: string; heading: string; message: string }[] = [];

  if (field === "username") {
    const next = String(body?.value ?? "").trim();
    if (next.length < 2 || next.length > 32 || !USERNAME_RE.test(next)) {
      return NextResponse.json({ error: "Username must be 2 to 32 characters: letters, numbers, spaces, dots, dashes, or underscores." }, { status: 400 });
    }
    if (next === target.username) return NextResponse.json({ error: "That is already the username." }, { status: 400 });
    data = { username: next };
    before = target.username;
    after = next;
    if (target.email) notify.push({ to: target.email, heading: "Your username was updated", message: `A RoleFlow support staff member changed your username from "${before}" to "${after}". If you did not expect this, contact us.` });
  } else if (field === "email") {
    const next = String(body?.value ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(next) || next.length > 254) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (next === (target.email ?? "").toLowerCase()) return NextResponse.json({ error: "That is already the email on the account." }, { status: 400 });
    data = { email: next, emailRemovedAt: null };
    before = target.email ? "(on file)" : "(none)";
    after = "(changed)";
    if (target.email) notify.push({ to: target.email, heading: "Your login email was changed", message: "A RoleFlow support staff member changed the email address on your account. Notices will now go to the new address. If you did not expect this, contact us." });
    notify.push({ to: next, heading: "This address is now on your RoleFlow account", message: "A RoleFlow support staff member set this address as the email on your account. If you did not expect this, contact us." });
  } else if (field === "unlinkRoblox") {
    if (!target.robloxId && !target.robloxUsername) return NextResponse.json({ error: "No Roblox account is linked." }, { status: 400 });
    data = { robloxId: null, robloxUsername: null, robloxAvatar: null };
    before = target.robloxUsername ?? "(linked)";
    after = "(unlinked)";
    if (target.email) notify.push({ to: target.email, heading: "Your Roblox link was removed", message: "A RoleFlow support staff member removed the Roblox account linked to your RoleFlow account. You can link it again in Settings. If you did not expect this, contact us." });
  } else {
    return NextResponse.json({ error: "Unknown field." }, { status: 400 });
  }

  await prisma.user.update({ where: { id: target.id }, data });

  for (const n of notify) {
    sendSecurityNoticeEmail({ toEmail: n.to, username: target.username, heading: n.heading, message: n.message })
      .catch((e) => console.error("Account edit notice failed:", e));
  }

  await recordAudit({
    actorId: caller.id,
    action: `SUPPORT_EDIT_${field.replace(/[A-Z]/g, (c) => "_" + c).toUpperCase()}`,
    targetId: target.id,
    details: { reason, ticketRef, before, after, notified: notify.length },
  });
  return NextResponse.json({ success: true, field, after });
}
