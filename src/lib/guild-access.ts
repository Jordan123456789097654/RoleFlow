import { NextResponse } from "next/server";
import { isFeatureEnabled } from "./feature-flags";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { verifySessionValue, SESSION_COOKIE_NAME } from "./session";
import { isSiteAdminUser } from "./roles";

/**
 * view:   any staff member (incl. view_only)
 * decide: owner, site admin, or staff with full_decision / position_editor
 * manage: owner or site admin only (settings, staff, positions, blacklist, exports)
 */
export type GuildLevel = "view" | "decide" | "manage";

export type AccessResult =
  | { ok: true; userId: string; guildId: string }
  | { ok: false; response: NextResponse };

const deny = (status: number, error: string): AccessResult => ({
  ok: false,
  response: NextResponse.json({ error }, { status }),
});

export async function authorizeGuild(guildId: string, level: GuildLevel): Promise<AccessResult> {
  const userId = await verifySessionValue(cookies().get(SESSION_COOKIE_NAME)?.value);
  if (!userId) return deny(401, "Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isSiteAdmin: true, siteRole: true, robloxId: true },
  });
  if (!user) return deny(401, "Unauthorized");
  if (!user.robloxId && (await isFeatureEnabled("roblox_linking"))) {
    return deny(403, "Link your Roblox account to continue.");
  }
  if (isSiteAdminUser(user)) return { ok: true, userId, guildId };

  const guild = await prisma.guild.findUnique({ where: { id: guildId }, select: { ownerId: true } });
  if (!guild) return deny(404, "Community not found");
  if (guild.ownerId === userId) return { ok: true, userId, guildId };
  if (level === "manage") return deny(403, "Forbidden: only the community owner can do this.");

  const staff = await prisma.guildStaff.findUnique({
    where: { guildId_userId: { guildId, userId } },
    select: { permissions: true },
  });
  if (!staff) return deny(403, "Forbidden: you do not have access to this community.");
  if (level === "view") return { ok: true, userId, guildId };
  if (["full_decision", "position_editor"].includes(staff.permissions)) {
    return { ok: true, userId, guildId };
  }
  return deny(403, "Forbidden: your staff role cannot perform this action.");
}

export async function authorizePosition(positionId: string, level: GuildLevel): Promise<AccessResult> {
  const position = await prisma.position.findUnique({ where: { id: positionId }, select: { guildId: true } });
  if (!position) return deny(404, "Position not found");
  return authorizeGuild(position.guildId, level);
}

export async function authorizeQuestion(questionId: string, level: GuildLevel): Promise<AccessResult> {
  const question = await prisma.question.findUnique({ where: { id: questionId }, select: { positionId: true } });
  if (!question) return deny(404, "Question not found");
  return authorizePosition(question.positionId, level);
}
