import { requiresSecondFactor, setPendingCookie } from "@/lib/second-factor";
import { signSessionValue } from "@/lib/session";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Missing or invalid reset token." }, { status: 400 });
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // Verify token exists and hasn't expired or been used
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
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

    if (requiresSecondFactor(updatedUser)) {
      const pendingRes = NextResponse.json({
        success: true,
        requires2fa: true,
        redirect: "/auth/2fa",
        message: "Password updated. Enter your 2FA code to finish signing in.",
      });
      setPendingCookie(pendingRes, updatedUser.id, updatedUser.sessionVersion, request.headers.get("host") || "");
      return pendingRes;
    }

    // Create session cookie so user is logged in automatically
    const response = NextResponse.json({
      success: true,
      message: "Password reset successful! You are now logged in.",
    });

    response.cookies.set("roleflow_user_id", signSessionValue(resetRecord.userId, updatedUser.sessionVersion), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
