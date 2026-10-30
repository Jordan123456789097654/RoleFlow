import { prisma } from "./prisma";
import { platformOrigin } from "./platform-origin";
import { signToken, verifyToken } from "./signed-token";

/**
 * Bulk-email unsubscribe. Tokens are bound to one address and never expire in practice (one year),
 * so an old email still unsubscribes. This only stops bulk campaigns. Account and application emails are unaffected.
 */
const TTL = 365 * 86_400;

export function unsubscribeToken(email: string): string {
  return signToken("unsub", { e: email.trim().toLowerCase() }, TTL);
}

export function unsubscribeUrl(email: string): string {
  return `${platformOrigin()}/api/unsubscribe?token=${encodeURIComponent(unsubscribeToken(email))}`;
}

/** The address a token was issued for, or null if the token is forged, expired, or malformed. */
export function emailFromUnsubscribeToken(token: string | null | undefined): string | null {
  const d = verifyToken<{ e: string }>("unsub", token);
  return d && typeof d.e === "string" && d.e.includes("@") ? d.e : null;
}

export async function recordOptOut(email: string, source: "UNSUBSCRIBE_LINK" | "ONE_CLICK" | "ADMIN") {
  const key = email.trim().toLowerCase();
  await prisma.emailOptOut.upsert({
    where: { email: key },
    update: {},
    create: { email: key, source },
  });
}

/** Every opted-out address, lowercase, as a set for fast checks. */
export async function optedOutSet(): Promise<Set<string>> {
  const rows = await prisma.emailOptOut.findMany({ select: { email: true } });
  return new Set(rows.map((r) => r.email));
}
