import { NextResponse } from "next/server";
import { createHash, randomInt, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { requiresCompanyEmail } from "@/lib/company-email-policy";
import { sendSecurityNoticeEmail } from "@/lib/email";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const CODE_TTL_MS = 15 * 60_000;
const RESEND_GAP_MS = 60_000;
const MAX_ATTEMPTS = 5;
const PERSONAL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "msn.com", "yahoo.com",
  "icloud.com", "me.com", "aol.com", "proton.me", "protonmail.com", "gmx.com", "mail.com", "yandex.com",
]);

async function requireSiteAdmin() {
  const userId = await verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!userId) return null;
  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, isSiteAdmin: true, isSupportStaff: true, siteRole: true },
  });
  return me && requiresCompanyEmail(me) ? me : null;
}

const codeHash = (code: string, userId: string) => createHash("sha256").update(`${userId}:${code}`).digest("hex");

/** Step 1: send a 6-digit code to a company email address. */
export async function POST(req: Request) {
  const me = await requireSiteAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254)
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (PERSONAL_DOMAINS.has(email.split("@")[1]))
    return NextResponse.json({ error: "Use your company email, not a personal address such as Gmail or Outlook." }, { status: 400 });

  const row = await prisma.user.findUnique({ where: { id: me.id }, select: { companyEmailCodeExpiresAt: true } });
  const now = Date.now();
  if (row?.companyEmailCodeExpiresAt && row.companyEmailCodeExpiresAt.getTime() - CODE_TTL_MS + RESEND_GAP_MS > now)
    return NextResponse.json({ error: "Wait a minute before requesting another code." }, { status: 429 });

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await prisma.user.update({
    where: { id: me.id },
    data: {
      pendingCompanyEmail: email,
      companyEmailCodeHash: codeHash(code, me.id),
      companyEmailCodeExpiresAt: new Date(now + CODE_TTL_MS),
      companyEmailAttempts: 0,
    },
  });

  try {
    await sendSecurityNoticeEmail({
      toEmail: email,
      username: me.username,
      heading: "Confirm your RoleFlow admin email",
      message: `Your confirmation code is ${code}. It expires in 15 minutes. If you did not ask for this, ignore this email.`,
    });
  } catch {
    return NextResponse.json({ error: "Could not send the code. Check the address and try again." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, sentTo: email });
}

/** Step 2: confirm the code. Five wrong guesses void the code. */
export async function PUT(req: Request) {
  const me = await requireSiteAdmin();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const code = String(body?.code ?? "").trim();
  if (!/^\d{6}$/.test(code)) return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });

  const row = await prisma.user.findUnique({
    where: { id: me.id },
    select: {
      pendingCompanyEmail: true,
      companyEmailCodeHash: true,
      companyEmailCodeExpiresAt: true,
      companyEmailAttempts: true,
    },
  });
  if (!row?.pendingCompanyEmail || !row.companyEmailCodeHash || !row.companyEmailCodeExpiresAt || row.companyEmailCodeExpiresAt < new Date())
    return NextResponse.json({ error: "That code has expired. Request a new one." }, { status: 400 });

  const a = Buffer.from(codeHash(code, me.id), "hex");
  const b = Buffer.from(row.companyEmailCodeHash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    const attempts = row.companyEmailAttempts + 1;
    const locked = attempts >= MAX_ATTEMPTS;
    await prisma.user.update({
      where: { id: me.id },
      data: locked
        ? { companyEmailCodeHash: null, companyEmailCodeExpiresAt: null, pendingCompanyEmail: null, companyEmailAttempts: 0 }
        : { companyEmailAttempts: attempts },
    });
    return NextResponse.json(
      { error: locked ? "Too many wrong codes. Request a new one." : "Incorrect code." },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: me.id },
    data: {
      companyEmail: row.pendingCompanyEmail,
      companyEmailVerifiedAt: new Date(),
      pendingCompanyEmail: null,
      companyEmailCodeHash: null,
      companyEmailCodeExpiresAt: null,
      companyEmailAttempts: 0,
    },
  });
  await recordAudit({
    actorId: me.id,
    action: "ADMIN_COMPANY_EMAIL_VERIFIED",
    targetId: me.id,
    details: { domain: row.pendingCompanyEmail.split("@")[1] },
  });
  return NextResponse.json({ ok: true });
}
