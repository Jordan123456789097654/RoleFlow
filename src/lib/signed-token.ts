import { createHmac, timingSafeEqual } from "crypto";

/**
 * Purpose-bound, expiring signed tokens. Every token names its purpose ("bridge", "appeal", ...),
 * so a token minted for one flow can never be accepted by another. Signing fails closed when
 * APP_SECRET is missing or too short, instead of quietly using an empty key.
 */

const MIN_SECRET_LENGTH = 16;

function secret(): string {
  const s = process.env.APP_SECRET;
  if (!s || s.length < MIN_SECRET_LENGTH) {
    throw new Error(`APP_SECRET must be set (at least ${MIN_SECRET_LENGTH} characters).`);
  }
  return s;
}

function mac(purpose: string, body: string): string {
  return createHmac("sha256", secret()).update(`${purpose}.${body}`).digest("base64url");
}

/** Format: base64url(JSON {d: data, e: expiresAtUnixSeconds}) + "." + HMAC. */
export function signToken(purpose: string, data: Record<string, string | number>, ttlSeconds: number): string {
  const body = Buffer.from(
    JSON.stringify({ d: data, e: Math.floor(Date.now() / 1000) + ttlSeconds }),
    "utf8"
  ).toString("base64url");
  return `${body}.${mac(purpose, body)}`;
}

/** Returns the signed data if the token is authentic, unexpired and minted for this purpose. Otherwise null. */
export function verifyToken<T extends Record<string, string | number>>(purpose: string, token: string | null | undefined): T | null {
  if (!token) return null;
  try {
    const dot = token.lastIndexOf(".");
    if (dot <= 0) return null;
    const body = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const a = Buffer.from(sig);
    const b = Buffer.from(mac(purpose, body));
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof parsed?.e !== "number" || parsed.e < Math.floor(Date.now() / 1000)) return null;
    if (!parsed.d || typeof parsed.d !== "object") return null;
    return parsed.d as T;
  } catch {
    return null;
  }
}

/**
 * Accepts only a same-site path such as "/dashboard?x=1". Rejects protocol-relative ("//host"),
 * backslash tricks ("/\host", which browsers read as "//host"), control characters, and anything
 * that resolves to a different origin.
 */
export function safeRelativePath(candidate: string | null | undefined, origin: string, fallback = "/"): string {
  if (!candidate || typeof candidate !== "string") return fallback;
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(candidate)) return fallback;
  try {
    const resolved = new URL(candidate, origin);
    if (resolved.origin !== new URL(origin).origin) return fallback;
    return resolved.pathname + resolved.search + resolved.hash;
  } catch {
    return fallback;
  }
}
