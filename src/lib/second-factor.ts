import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { sendSecurityNoticeEmail } from "./email";
import { signSessionValue } from "./session";
import { isSiteAdminUser } from "./roles";

export const SESSION_COOKIE = "roleflow_user_id";
export const PENDING_2FA_COOKIE = "roleflow_2fa_pending";

/** 2FA has been disabled across the platform. */
export function requiresSecondFactor(u: { id?: string; isSiteAdmin?: boolean | null; siteRole?: string | null }): boolean {
  return false;
}

const domainOpt = (host?: string) => ({ domain: ".roleflow.site" });

export function setPendingCookie(res: NextResponse, userId: string, version: number, host: string) {
  res.cookies.set(PENDING_2FA_COOKIE, signSessionValue(userId, version), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 60 * 10,
    ...domainOpt(host),
  });
}

export function setSessionCookie(res: NextResponse, userId: string, version: number, host: string) {
  res.cookies.set(SESSION_COOKIE, signSessionValue(userId, version), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 60 * 60 * 24 * 30,
    ...domainOpt(host),
  });
  res.cookies.set(PENDING_2FA_COOKIE, "", { path: "/", maxAge: 0, ...domainOpt(host) });
}

export function generateRecoveryCodes(): string[] {
  return Array.from({ length: 8 }, () => randomBytes(5).toString("hex"));
}

export async function hashRecoveryCodes(codes: string[]): Promise<string> {
  return JSON.stringify(await Promise.all(codes.map((c) => bcrypt.hash(c, 10))));
}

/** Uses a recovery code once. Returns true if it matched and was removed. */
export async function consumeRecoveryCode(userId: string, stored: string | null, code: string): Promise<boolean> {
  if (!stored) return false;
  const hashes: string[] = JSON.parse(stored);
  const input = code.trim().toLowerCase();
  for (let i = 0; i < hashes.length; i++) {
    if (await bcrypt.compare(input, hashes[i])) {
      hashes.splice(i, 1);
      await prisma.user.update({
        where: { id: userId },
        data: { totpRecoveryCodes: JSON.stringify(hashes) },
      });
      return true;
    }
  }
  return false;
}

/** Emails the account owner the first time a device signs in. The very first device is not announced. */
export async function notifyNewDevice(
  user: { id: string; username: string; email: string | null; emailNotifications?: boolean | null },
  request: Request
): Promise<void> {
  try {
    const ua = request.headers.get("user-agent") || "unknown";
    const fingerprint = createHash("sha256").update(ua).digest("hex");

    const known = await prisma.loginDevice.findUnique({
      where: { userId_fingerprint: { userId: user.id, fingerprint } },
    });
    if (known) {
      await prisma.loginDevice.update({ where: { id: known.id }, data: { lastSeenAt: new Date() } });
      return;
    }

    await prisma.loginDevice.create({
      data: { userId: user.id, fingerprint, userAgent: ua.slice(0, 255) },
    });

    const deviceCount = await prisma.loginDevice.count({ where: { userId: user.id } });
    if (deviceCount > 1 && user.email && user.emailNotifications !== false) {
      await sendSecurityNoticeEmail({
        toEmail: user.email,
        username: user.username,
        heading: "New sign-in to your RoleFlow account",
        message: `Your account was just signed in to from a device or browser we haven't seen before (${ua.slice(0, 120)}).`,
      });
    }
  } catch (err) {
    console.error("New device notification failed:", err);
  }
}
