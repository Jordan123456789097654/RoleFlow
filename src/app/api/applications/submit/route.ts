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

    // Check if community is paused by founder or owner
    if (position.guild.isPaused) {
      return NextResponse.json(
        { error: "This community is currently paused by administrators and not accepting submissions." },
        { status: 403 }
      );
    }

    // Check Global Blacklist / Platform Ban
    if (user.isBanned) {
      return NextResponse.json(
        { error: "Your account is suspended from the RoleFlow platform." },
        { status: 403 }
      );
    }

    const isGloballyBlacklisted = await prisma.globalBlacklist.findFirst({
      where: {
        OR: [
          { targetType: "DISCORD_ID", targetValue: user.id },
          ...(robloxUsername
            ? [{ targetType: "ROBLOX_ID", targetValue: robloxUsername }]
            : []),
        ],
      },
    });

    if (isGloballyBlacklisted) {
      return NextResponse.json(
        { error: `You have been globally blacklisted from RoleFlow: ${isGloballyBlacklisted.reason || "Policy violation"}` },
        { status: 403 }
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

    // 2b. Check Roblox Group Membership & Rank (Feature #2)
    if (position.guild.enableRobloxGroupCheck && position.guild.robloxGroupId) {
      const targetRobloxUser = robloxUsername || user.robloxUsername;
      if (!targetRobloxUser) {
        return NextResponse.json(
          { error: "This community requires a linked Roblox account to apply. Please link your Roblox username." },
          { status: 400 }
        );
      }

      try {
        let rUserId = user.robloxId;
        if (!rUserId) {
          const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usernames: [targetRobloxUser], excludeBannedUsers: false }),
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            if (userData.data && userData.data.length > 0) {
              rUserId = String(userData.data[0].id);
            }
          }
        }

        if (!rUserId) {
          return NextResponse.json(
            { error: `Could not verify Roblox username "${targetRobloxUser}". Please ensure it exists on Roblox.` },
            { status: 400 }
          );
        }

        const groupRes = await fetch(`https://groups.roblox.com/v2/users/${rUserId}/groups/roles`);
        if (groupRes.ok) {
          const groupData = await groupRes.json();
          const targetGroup = groupData.data?.find((g: any) => String(g.group.id) === String(position.guild.robloxGroupId));
          
          if (!targetGroup) {
            return NextResponse.json(
              { error: `You must join the community's official Roblox group (ID: ${position.guild.robloxGroupId}) before applying.` },
              { status: 403 }
            );
          }

          const requiredRank = position.guild.robloxMinRank || 1;
          if (targetGroup.role.rank < requiredRank) {
            return NextResponse.json(
              { error: `You need rank ${requiredRank}+ in the Roblox group to apply (Your current rank is ${targetGroup.role.rank} - "${targetGroup.role.name}").` },
              { status: 403 }
            );
          }
        }
      } catch (e) {
        console.error("Roblox group verification error:", e);
      }
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
