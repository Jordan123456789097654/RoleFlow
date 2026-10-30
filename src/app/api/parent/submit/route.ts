import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateParentSubmission } from "@/lib/parent-submission";
import { Resend } from "resend";
import { SUPPORT_EMAIL } from "@/lib/parent-site";

export const dynamic = "force-dynamic";

const resendApiKey = process.env.RESEND_API_KEY || "";
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "RoleFlow <onboarding@resend.dev>";

export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => ({}));
    const validation = validateParentSubmission(raw);

    if (!validation.ok || !validation.data) {
      return NextResponse.json({ error: validation.error || "Invalid request." }, { status: 400 });
    }

    const { kind, email, name, message, interest } = validation.data;

    // Skip duplicates for notify and newsletter
    if (kind === "notify" || kind === "newsletter") {
      const existing = await prisma.siteSubmission.findFirst({
        where: {
          kind,
          email,
          ...(interest ? { interest } : {}),
        },
      });

      if (existing) {
        return NextResponse.json({
          ok: true,
          message: kind === "newsletter" ? "You are already subscribed to updates." : "You are already on the notify list.",
        });
      }
    }

    // Record submission in database
    await prisma.siteSubmission.create({
      data: {
        kind,
        email,
        name,
        message,
        interest,
      },
    });

    // Send contact notification to support team
    if (kind === "contact" || kind === "idea") {
      const subject = kind === "idea" ? `[RoleFlow Product Suggestion] from ${name || email}` : `[RoleFlow Contact Inquiry] from ${name || email}`;
      const textBody = `New ${kind} submission received on roleflow.site:\n\nFrom: ${name || "Anonymous"} <${email}>\n\nMessage:\n${message || "(No message)"}\n`;

      if (resend) {
        try {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: SUPPORT_EMAIL,
            subject,
            text: textBody,
          });
        } catch (err) {
          console.error("Failed to forward contact submission email:", err);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: kind === "contact" ? "Thank you! We received your message and will reply shortly." : "Thank you! You have been added.",
    });
  } catch (err) {
    console.error("Parent submit error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
