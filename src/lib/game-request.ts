import { NextResponse } from "next/server";
import { verifyGameSecret } from "./game-secret";

export function bearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
}

/** Returns a 401 response unless the request carries this community's game secret. */
export async function requireGameSecret(guildId: string, req: Request): Promise<NextResponse | null> {
  return (await verifyGameSecret(guildId, bearerToken(req)))
    ? null
    : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function validJobId(value: unknown): string | null {
  const s = String(value ?? "");
  return s.length >= 1 && s.length <= 100 ? s : null;
}

export function validDigits(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value);
  return /^\d{1,20}$/.test(s) ? s : null;
}

/** Rejects payloads whose sentAt (unix seconds) is more than 2 minutes from server time. */
export function clockOk(sentAt: unknown): boolean {
  const n = Number(sentAt);
  return Number.isFinite(n) && Math.abs(Math.floor(Date.now() / 1000) - n) <= 120;
}
