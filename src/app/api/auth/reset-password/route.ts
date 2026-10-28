// Password reset API route
import { signSessionValue } from "@/lib/session";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sha256 } from "@/lib/crypto";
import { setSessionCookie } from "@/lib/session-cookie";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Missing or invalid reset token." }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8 || Buffer.byteLength(newPassword) > 72) {
      return NextResponse.json(
        { error: "Password must be between 8 and 72 characters." },
        { status: 400 }
      );
    }

    // Verify token exists and hasn't expired or been used
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token: sha256(token) },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.used) {
      return NextResponse.json(
        { error: "This password reset link has already been used or is invalid." },
        { status: 400 }
      );
    }

    if (new Date() > resetRecord.expiresAt) {
      return NextResponse.json(
        { error: "This password reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash the new password with bcrypt salt
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update user password and mark token as used
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash, sessionVersion: { increment: 1 } }, // revokes all other sessions
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { used: true },
      }),
    ]);

    // Create session cookie so user is logged in automatically
    const response = NextResponse.json({
      success: true,
      message: "Password reset successful! You are now logged in.",
    });

    setSessionCookie(response, signSessionValue(resetRecord.userId, updatedUser.sessionVersion));

    return response;
  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
