import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signSessionValue } from "@/lib/session";
import { setSessionCookie } from "@/lib/session-cookie";
import { findActiveBan } from "@/lib/bans";
import { notifyNewDevice } from "@/lib/second-factor";

export const dynamic = "force-dynamic";

/**
 * Handles password login with email and password.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Check bans and suspensions
    const ban = await findActiveBan({ discordId: user.id });
    if (ban) {
      return NextResponse.json({ error: "Your account is currently suspended." }, { status: 403 });
    }

    await notifyNewDevice(user, request);

    const response = NextResponse.json({
      success: true,
      message: "Signed in successfully.",
    });

    setSessionCookie(response, signSessionValue(user.id, user.sessionVersion));
    return response;
  } catch (err) {
    console.error("Password login error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
