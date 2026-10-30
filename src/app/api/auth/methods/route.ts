import { verifySessionValue } from "@/lib/session";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

/**
 * Returns the user's connected login methods (Discord and Email/Password).
 */
export async function GET() {
  const userId = await verifySessionValue(cookies().get("roleflow_user_id")?.value);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      passwordHash: true,
      discordLinked: true,
      username: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const hasDiscord = user.discordLinked !== false;
  const hasPassword = Boolean(user.email && user.passwordHash);

  return NextResponse.json({
    hasDiscord,
    hasPassword,
    email: user.email,
  });
}

/**
 * Link or unlink login methods:
 * - action "link_password": { email, password }
 * - action "unlink_password": {}
 * - action "unlink_discord": {}
 *
 * UNLINK PROTECTION:
 * A user is strictly prevented from unlinking their last active login method.
 */
export async function POST(request: Request) {
  const userId = await verifySessionValue(cookies().get("roleflow_user_id")?.value);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      discordLinked: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const { action } = body;

  const hasDiscord = user.discordLinked !== false;
  const hasPassword = Boolean(user.email && user.passwordHash);

  if (action === "unlink_discord") {
    if (!hasDiscord) {
      return NextResponse.json({ error: "Discord is not linked to this account." }, { status: 400 });
    }
    // Block unlinking if this is the only login method
    if (!hasPassword) {
      return NextResponse.json(
        { error: "Cannot unlink Discord. You must set an email and password first so you don't lose access to your account." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { discordLinked: false },
    });

    return NextResponse.json({ success: true, message: "Discord unlinked successfully." });
  }

  if (action === "unlink_password") {
    if (!hasPassword) {
      return NextResponse.json({ error: "Email/password is not active on this account." }, { status: 400 });
    }
    // Block unlinking if this is the only login method
    if (!hasDiscord) {
      return NextResponse.json(
        { error: "Cannot remove password. You must link Discord first so you don't lose access to your account." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: null },
    });

    return NextResponse.json({ success: true, message: "Password removed successfully." });
  }

  if (action === "link_password") {
    const { email, password } = body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 8 || Buffer.byteLength(password) > 72) {
      return NextResponse.json({ error: "Password must be between 8 and 72 characters." }, { status: 400 });
    }

    // Check if another user is already registered with this email
    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
        id: { not: userId },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "An account already exists with that email address." }, { status: 409 });
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await prisma.user.update({
      where: { id: userId },
      data: {
        email: cleanEmail,
        passwordHash,
      },
    });

    return NextResponse.json({ success: true, message: "Email and password successfully linked to your account." });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
