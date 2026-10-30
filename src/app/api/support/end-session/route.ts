import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { parseSessionValue, SESSION_COOKIE_NAME } from "@/lib/session";
import { clearSessionCookie, clearSupportReturnCookie, clearSupportTicketCookie, setSessionCookie, SUPPORT_RETURN_COOKIE } from "@/lib/session-cookie";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Ends a diagnostic session. If the staff member's own session was stored when the session started,
 * it is restored, so they return to their account. Otherwise the browser is signed out.
 */
export async function POST() {
  const jar = cookies();
  const memberId = parseSessionValue(jar.get(SESSION_COOKIE_NAME)?.value)?.userId ?? null;
  const staffSession = jar.get(SUPPORT_RETURN_COOKIE)?.value;
  const staffId = parseSessionValue(staffSession)?.userId ?? null;

  const response = NextResponse.json({ success: true, returnedToOwnAccount: Boolean(staffId) });
  if (staffId && staffSession) {
    setSessionCookie(response, staffSession);
  } else {
    clearSessionCookie(response);
  }
  clearSupportReturnCookie(response);
  clearSupportTicketCookie(response);

  if (memberId) {
    await recordAudit({ actorId: staffId ?? memberId, action: "SUPPORT_SESSION_END", targetId: memberId });
  }
  return response;
}
