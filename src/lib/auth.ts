import { cookies } from "next/headers";
import { prisma } from "./prisma";

export interface CurrentUser {
  id: string;
  username: string;
  avatar: string | null;
  robloxUsername: string | null;
  isSiteAdmin: boolean;
}

/**
 * Retrieves the currently logged-in user from cookies or falls back to a default mock demo user
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const cookieStore = cookies();
  const userId = cookieStore.get("roleflow_user_id")?.value;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (user) {
      return {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        robloxUsername: user.robloxUsername,
        isSiteAdmin: user.isSiteAdmin,
      };
    }
  }

  // Default dev/demo user (Jordan - Site Admin & Community Owner)
  let defaultUser = await prisma.user.findUnique({
    where: { id: "1046538179399929957" },
  });

  if (!defaultUser) {
    defaultUser = await prisma.user.findFirst({
      where: { isSiteAdmin: true },
    });
  }

  if (!defaultUser) {
    defaultUser = await prisma.user.upsert({
      where: { id: "dev_admin_user" },
      update: {},
      create: {
        id: "dev_admin_user",
        username: "Jordan",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
        robloxUsername: "JordanDev",
        isSiteAdmin: true,
      },
    });
  }

  return {
    id: defaultUser.id,
    username: defaultUser.username,
    avatar: defaultUser.avatar,
    robloxUsername: defaultUser.robloxUsername,
    isSiteAdmin: defaultUser.isSiteAdmin,
  };
}
