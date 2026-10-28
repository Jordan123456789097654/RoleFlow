import { cookies } from "next/headers";
import { prisma } from "./prisma";

export interface CurrentUser {
  id: string;
  username: string;
  avatar: string | null;
  robloxId: string | null;
  robloxUsername: string | null;
  email: string | null;
  emailNotifications?: boolean;
  isSiteAdmin: boolean;
  isSupportStaff: boolean;
  siteRole: string; // FOUNDER, ADMIN, MODERATOR, SUPPORT, STAFF, USER
  isBanned: boolean;
  hasCommunities: boolean;
}

/**
 * Retrieves the currently logged-in user from the session cookie.
 * Returns null if the user has not logged in.
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

  // Derive granular site staff role
  const isFounder = user.id === "1046538179399929957";
  const rawRole = user.siteRole || (isFounder ? "FOUNDER" : user.isSiteAdmin ? "ADMIN" : user.isSupportStaff ? "SUPPORT" : "USER");
  const siteRole = isFounder ? "FOUNDER" : rawRole;

  // Permissions based on role
  const isSiteAdmin = siteRole === "FOUNDER" || siteRole === "ADMIN" || Boolean(user.isSiteAdmin);
  const isSupportStaff = isSiteAdmin || siteRole === "MODERATOR" || siteRole === "SUPPORT" || siteRole === "STAFF" || Boolean(user.isSupportStaff);

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
    emailNotifications: user.emailNotifications ?? true,
    isSiteAdmin,
    isSupportStaff,
    siteRole,
    isBanned: Boolean(user.isBanned),
    hasCommunities,
  };
}
