import { Resend } from "resend";
import { prisma } from "./prisma";
import { buildRoster, currentWeekWindow } from "./staff-roster";

const resend = new Resend(process.env.RESEND_API_KEY || "");
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "RoleFlow <onboarding@resend.dev>";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type ReportOutcome = "sent" | "skipped:unlinked" | "skipped:already-sent" | "skipped:no-owner-email" | "failed";

/**
 * Emails the community owner last week's quota results: staff under quota and
 * staff whose Roblox account isn't linked. Sends at most once per week.
 */
export async function sendInactivityReport(guildId: string, now = new Date()): Promise<ReportOutcome> {
  const guild = await prisma.guild.findUnique({
    where: { id: guildId },
    select: { name: true, ownerId: true, robloxGroupId: true, staffReportSentFor: true },
  });
  if (!guild || !guild.robloxGroupId) return "skipped:unlinked";

  const thisWeekStart = currentWeekWindow(now).start;
  const lastWeek = currentWeekWindow(new Date(thisWeekStart.getTime() - 1000));
  const weekKey = lastWeek.start.toISOString();
  if (guild.staffReportSentFor === weekKey) return "skipped:already-sent";

  const owner = await prisma.user.findUnique({ where: { id: guild.ownerId }, select: { email: true } });
  if (!owner?.email) return "skipped:no-owner-email";

  // Roster as it stood at the end of last week.
  const roster = await buildRoster(guildId, new Date(thisWeekStart.getTime() - 1000));
  const underQuota = roster.members.filter((m) => m.percent != null && m.percent < 100);
  const unlinked = roster.members.filter((m) => !m.robloxUserId);

  const rows = (list: typeof underQuota) =>
    list.length
      ? list
          .map((m) => `<li>${escapeHtml(m.username)}${m.percent != null ? ` — ${m.percent}% of quota` : ""}</li>`)
          .join("")
      : "<li>None</li>";

  const html = `
    <p>Staff quota report for <strong>${escapeHtml(guild.name)}</strong>,
    week of ${lastWeek.start.toISOString().slice(0, 10)} (UTC).</p>
    <h3>Under quota</h3><ul>${rows(underQuota)}</ul>
    <h3>Roblox not linked</h3><ul>${rows(unlinked)}</ul>
    <p>Open the staff page in RoleFlow to review details.</p>`;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: owner.email,
    subject: `${guild.name}: staff quota report`,
    html,
  });
  if (error) {
    console.error("[StaffReport] send failed:", error);
    return "failed";
  }

  await prisma.guild.update({ where: { id: guildId }, data: { staffReportSentFor: weekKey } });
  return "sent";
}
