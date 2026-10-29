import { findActiveBan } from "@/lib/bans";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { BotDispatcher } from "@/lib/bot-dispatcher";
import { dispatchCommunityWebhook } from "@/lib/webhook-dispatcher";
import { sendApplicationSubmissionReceipt } from "@/lib/email";
import { logger } from "@/lib/logger";
import { discordSafe } from "@/lib/sanitize";
import { checkRobloxAccountAge, checkUserBadgeOwnership, checkUserAssetOwnership } from "@/lib/roblox";
import { availabilityOf } from "@/lib/position-availability";
import { randomBytes } from "crypto";

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

    if (!positionId || typeof positionId !== "string" || !answers || typeof answers !== "object" || Array.isArray(answers)) {
      return NextResponse.json(
        { error: "Missing required position ID or answers." },
        { status: 400 }
      );
    }

    if (robloxUsername !== undefined && robloxUsername !== null && robloxUsername !== "" && !/^[A-Za-z0-9_]{3,20}$/.test(String(robloxUsername))) {
      return NextResponse.json({ error: "That does not look like a valid Roblox username." }, { status: 400 });
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

    const availability = availabilityOf(position);
    if (!availability.open) {
      return NextResponse.json({ error: availability.message }, { status: 400 });
    }

    // Check if community is paused by founder or owner
    if (!position.guild.applicationsOpen) {
      return NextResponse.json({ error: "This community is not accepting applications right now." }, { status: 403 });
    }
    if (position.guild.isPaused) {
      return NextResponse.json(
        { error: "This community is currently paused by administrators and not accepting submissions." },
        { status: 403 }
      );
    }

    // Check Global Blacklist / Platform Ban
    const platformBan = await findActiveBan({ discordId: user.id, robloxUsername: user.robloxUsername, robloxId: user.robloxId });
    if (platformBan) {
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
            ? [{ targetType: "ROBLOX_ID", targetValue: { equals: String(robloxUsername), mode: "insensitive" as const } }]
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
            ? [{ targetType: "ROBLOX_ID", targetValue: { equals: String(robloxUsername), mode: "insensitive" as const } }]
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

    // 2b. Check Roblox Requirements (Group Membership, Rank, Account Age, and Required Badge)
    const requiresRobloxCheck =
      (position.guild.enableRobloxGroupCheck && position.guild.robloxGroupId) ||
      (position.guild.robloxMinAccountAgeDays && position.guild.robloxMinAccountAgeDays > 0) ||
      Boolean(position.guild.robloxRequiredBadgeId);

    if (requiresRobloxCheck) {
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

        // Check Minimum Account Age
        if (position.guild.robloxMinAccountAgeDays && position.guild.robloxMinAccountAgeDays > 0) {
          const ageCheck = await checkRobloxAccountAge(rUserId, position.guild.robloxMinAccountAgeDays);
          if (!ageCheck.valid) {
            return NextResponse.json(
              { error: ageCheck.error || `Your Roblox account must be at least ${position.guild.robloxMinAccountAgeDays} days old to apply.` },
              { status: 403 }
            );
          }
        }

        // Check Required Badge
        if (position.guild.robloxRequiredBadgeId && position.guild.robloxRequiredBadgeId.trim()) {
          const badgeCheck = await checkUserBadgeOwnership(rUserId, position.guild.robloxRequiredBadgeId.trim());
          if (!badgeCheck.owned) {
            return NextResponse.json(
              { error: badgeCheck.error || `You do not own the required Roblox badge (ID: ${position.guild.robloxRequiredBadgeId}) to apply.` },
              { status: 403 }
            );
          }
        }

        // Check required Roblox asset / Game Pass
        if (position.guild.robloxRequiredAssetId && position.guild.robloxRequiredAssetId.trim()) {
          const assetCheck = await checkUserAssetOwnership(rUserId, position.guild.robloxRequiredAssetId.trim());
          if (!assetCheck.owned) {
            return NextResponse.json(
              { error: assetCheck.error || "You do not own the required Roblox item to apply." },
              { status: 403 }
            );
          }
        }

        // Check Group Membership & Rank
        if (position.guild.enableRobloxGroupCheck && position.guild.robloxGroupId) {
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
        }
      } catch (e) {
        console.error("Roblox verification error:", e);
      }
    }

    // 2c. Validate answers: only this position's questions, bounded size.
    const validIds = new Set(position.questions.map((q) => q.id));
    const entries = Object.entries(answers as Record<string, unknown>);
    if (entries.length > 60 || entries.some(([id, v]) => !validIds.has(id) || typeof v !== "string" && typeof v !== "number" && typeof v !== "boolean")) {
      return NextResponse.json({ error: "Your answers do not match this application form. Please reload and try again." }, { status: 400 });
    }
    if (entries.some(([, v]) => String(v).length > 4000)) {
      return NextResponse.json({ error: "One of your answers is too long (4000 characters max)." }, { status: 400 });
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

    // 4b. Application cap / waitlist
    let waitlisted = false;
    if (position.maxApplications) {
      const filled = await prisma.application.count({
        where: { positionId, waitlisted: false, status: { not: "REJECTED" } },
      });
      if (filled >= position.maxApplications) {
        if (position.waitlistEnabled) {
          waitlisted = true;
        } else {
          return NextResponse.json({ error: "This opening has reached its application limit." }, { status: 409 });
        }
      }
    }

    // 5. Create Application & Answers in database
    const application = await prisma.application.create({
      data: {
        positionId,
        userId: user.id,
        status: "PENDING",
        waitlisted,
        trackingToken: randomBytes(16).toString("hex"),
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
      positionTitle: waitlisted ? `${position.title} (Waitlist)` : position.title,
      applicantDiscordId: user.id,
      applicantUsername: user.username,
      applicantAvatar: user.avatar,
      robloxUsername: robloxUsername || user.robloxUsername,
      summaryAnswers,
    });

    const applicantMention = user.id.startsWith("usr_") ? `**Applicant:** ${user.username} (Web Applicant)` : `**Applicant:** ${user.username} (<@${user.id}>)`;

    // Dispatch receipt confirmation email to applicant if user has email
    if (user.email && user.emailNotifications !== false) {
      sendApplicationSubmissionReceipt({
        toEmail: user.email,
        applicantName: user.username,
        communityName: position.guild.name,
        positionTitle: position.title,
      }).catch((e) => console.warn("Submission receipt email failed:", e));
    }

    // Also dispatch to configured community Discord webhook
    await dispatchCommunityWebhook({
      guildId: position.guildId,
      event: "SUBMISSION",
      title: `New Application: ${position.title}`,
      description: `**Applicant:** ${user.username} (<@${user.id}>)\n**Roblox:** ${discordSafe(robloxUsername || user.robloxUsername || "Unlinked", 40)}\n[Review on RoleFlow Dashboard](https://roleflow.site/dashboard/${position.guildId})`,
      fields: summaryAnswers.slice(0, 3).map((a) => ({
        name: a.label.slice(0, 250),
        value: a.value.slice(0, 500) || "No answer",
        inline: false,
      })),
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
      waitlisted,
      trackingToken: application.trackingToken,
    });
  } catch (err) {
    console.error("Error creating application:", err);
    return NextResponse.json(
      { error: "Failed to submit application. Please try again." },
      { status: 500 }
    );
  }
}
