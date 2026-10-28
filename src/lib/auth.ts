import { cookies } from "next/headers";
import { prisma } from "./prisma";

export interface CurrentUser {
  id: string;
  username: string;
  avatar: string | null;
  robloxId: string | null;
  robloxUsername: string | null;
  email: string | null;
  isSiteAdmin: boolean;
  isSupportStaff: boolean;
  isBanned: boolean;
  hasCommunities: boolean;
}

/**
 * Retrieves the currently logged-in user from the Discord OAuth2 session cookie.
 * Returns null if the user has not logged in through Discord OAuth2.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = cookies();
  const userId = cookieStore.get("roleflow_user_id")?.value;

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return null;
  }

  // Site owner fallback
  const isSiteAdmin = user.isSiteAdmin || user.id === "1046538179399929957";

  // Check if user owns at least one community
  const guildCount = await prisma.guild.count({
    where: { ownerId: user.id },
  });

  const hasCommunities = guildCount > 0 || isSiteAdmin;

  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    robloxId: user.robloxId,
    robloxUsername: user.robloxUsername,
    email: user.email,
    isSiteAdmin,
    isSupportStaff: user.isSupportStaff || isSiteAdmin,
    isBanned: Boolean(user.isBanned),
    hasCommunities,
  };
}
