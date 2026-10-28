import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { BotDispatcher } from "@/lib/bot-dispatcher";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in with Discord before submitting an application." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { positionId, robloxUsername, answers } = body;

    if (!positionId || !answers) {
      return NextResponse.json(
        { error: "Missing required position ID or answers." },
        { status: 400 }
      );
    }

    // 1. Fetch position & guild details
    const position = await prisma.position.findUnique({
      where: { id: positionId },
      include: {
        guild: true,
        questions: true,
      },
    });

    if (!position || !position.isOpen) {
      return NextResponse.json(
        { error: "This position is currently closed to new applications." },
        { status: 400 }
      );
    }

    // 2. Check Blacklist for this guild
    const isBlacklisted = await prisma.blacklist.findFirst({
      where: {
        guildId: position.guildId,
        OR: [
          { targetType: "DISCORD_ID", targetValue: user.id },
          ...(robloxUsername
            ? [{ targetType: "ROBLOX_ID", targetValue: robloxUsername }]
            : []),
        ],
      },
    });

    if (isBlacklisted) {
      return NextResponse.json(
        { error: "You are not eligible to apply to this community." },
        { status: 403 }
      );
    }

    // 3. Check for existing PENDING application
    const existingPending = await prisma.application.findFirst({
      where: {
        positionId,
        userId: user.id,
        status: { in: ["PENDING", "UNDER_REVIEW", "INTERVIEW"] },
      },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: "You already have an active application under review for this opening." },
        { status: 400 }
      );
    }

    // 4. Check Cooldown if previously REJECTED
    if (position.guild.cooldownDays > 0) {
      const lastRejected = await prisma.application.findFirst({
        where: {
          positionId,
          userId: user.id,
          status: "REJECTED",
        },
        orderBy: { updatedAt: "desc" },
      });

      if (lastRejected) {
        const cooldownMillis = position.guild.cooldownDays * 24 * 60 * 60 * 1000;
        const elapsed = Date.now() - new Date(lastRejected.updatedAt).getTime();
        if (elapsed < cooldownMillis) {
          const daysLeft = Math.ceil((cooldownMillis - elapsed) / (24 * 60 * 60 * 1000));
          return NextResponse.json(
            { error: `You recently applied for this position. Please wait ${daysLeft} more day(s) before re-applying.` },
            { status: 429 }
          );
        }
      }
    }

    // Update user's Roblox username if provided
    if (robloxUsername) {
      await prisma.user.update({
        where: { id: user.id },
        data: { robloxUsername },
      });
    }

    // 5. Create Application & Answers in database
    const application = await prisma.application.create({
      data: {
        positionId,
        userId: user.id,
        status: "PENDING",
        answers: {
          create: Object.entries(answers).map(([questionId, value]) => ({
            questionId,
            value: String(value),
          })),
        },
      },
      include: {
        answers: {
          include: { question: true },
        },
      },
    });

    // 6. Trigger Discord alert embed via BotDispatcher
    const summaryAnswers = application.answers.map((a) => ({
      label: a.question.label,
      value: a.value,
    }));

    // Fire and forget or await dispatch
    await BotDispatcher.sendApplicationAlert({
      applicationId: application.id,
      guildId: position.guildId,
      positionTitle: position.title,
      applicantDiscordId: user.id,
      applicantUsername: user.username,
      applicantAvatar: user.avatar,
      robloxUsername: robloxUsername || user.robloxUsername,
      summaryAnswers,
    });

    logger.info("New candidate application submitted", {
      applicationId: application.id,
      position: position.title,
      guildId: position.guildId,
      applicant: user.username,
    });

    return NextResponse.json({
      success: true,
      applicationId: application.id,
    });
  } catch (err) {
    console.error("Error creating application:", err);
    return NextResponse.json(
      { error: "Failed to submit application. Please try again." },
      { status: 500 }
    );
  }
}
