import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";
import { sha256 } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@") || email.length > 254) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Look for user by email
    const user = await prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: "insensitive" },
      },
    });

    // Security practice: Always return generic success so user enumeration is prevented
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with that email, a password reset link has been dispatched.",
      });
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

    // Delete any previous unused tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Create new token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: sha256(token), // only the hash is stored; the raw token exists only in the email link
        expiresAt,
      },
    });

    // Dispatch email via Resend
    const result = await sendPasswordResetEmail(cleanEmail, user.username, token);

    if (!result.success) {
      // Do not reveal to the caller that this address has an account.
      console.error("Password reset email failed:", result.error);
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, a password reset link has been dispatched.",
    });
  } catch (err: any) {
    console.error("Forgot password API error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
