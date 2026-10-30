import { PARENT_ORIGIN } from "./platform-hosts";

const FALLBACK = PARENT_ORIGIN;

/**
 * The public origin of RoleFlow itself. Only an https address is accepted; anything else
 * (http, localhost, a typo) falls back to the canonical parent origin.
 */
export function platformOrigin(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/+$/, "");
  try {
    const u = new URL(raw);
    if (u.protocol === "https:" && u.hostname !== "localhost" && u.hostname !== "127.0.0.1") {
      return u.origin;
    }
  } catch {
    /* fall through */
  }
  return FALLBACK;
}
