import { isFounderId } from "@/lib/roles";
import { isGuildPaid } from "@/lib/licensing";
import { encryptSecret } from "@/lib/crypto";
import { sanitizeGuild } from "@/lib/sanitize";
import { verifySessionValue } from "@/lib/session";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const userId = await verifySessionValue(cookieStore.get("roleflow_user_id")?.value);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found." }, { status: 401 });
    }

    const guild = await prisma.guild.findUnique({
      where: { id: params.id },
    });

    if (!guild) {
      return NextResponse.json({ error: "Guild not found." }, { status: 404 });
    }

    const isOwner = guild.ownerId === currentUser.id;
    const isSiteAdmin = currentUser.isSiteAdmin || isFounderId(currentUser.id);

    if (!isOwner && !isSiteAdmin) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this community." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      vanitySlug,
      description,
      tags,
      icon,
      banner,
      requireInGuild,
      minAccountAgeDays,
      cooldownDays,
      enableRobloxAuth,
      enableBlindVoting,
      votePassThreshold,
      enableRobloxGroupCheck,
      robloxGroupId,
      robloxMinRank,
      useCustomBot,
      customBotToken,
      logChannelId,
      staffPingRoleId,
      embedColor,
      webhookUrl,
      portalTheme,
      portalLayout,
      portalAccentColor,
      discordWidgetEnabled,
      applicationsOpen,
      showApplicantCount,
      welcomeMessage,
      websiteUrl,
      discordInviteUrl,
      customBotAppId,
      customBotPublicKey,
      robloxMinAccountAgeDays,
      robloxCloudApiKey,
      robloxAcceptRankId,
      robloxRequiredBadgeId,
    } = body;

    if (customBotAppId && !/^\d{17,20}$/.test(String(customBotAppId).trim())) {
      return NextResponse.json({ error: "The bot application ID must be a Discord ID (17-20 digits)." }, { status: 400 });
    }
    if (customBotPublicKey && !/^[0-9a-fA-F]{64}$/.test(String(customBotPublicKey).trim())) {
      return NextResponse.json({ error: "The bot public key must be 64 hex characters." }, { status: 400 });
    }

    for (const [label, value] of [["Website", websiteUrl], ["Discord invite", discordInviteUrl]] as const) {
      if (value && !/^https:\/\/[^\s]+$/.test(String(value).trim())) {
        return NextResponse.json({ error: `${label} must be a full https:// link.` }, { status: 400 });
      }
    }
    if (welcomeMessage && String(welcomeMessage).length > 500) {
      return NextResponse.json({ error: "The welcome message must be 500 characters or fewer." }, { status: 400 });
    }

    if (customBotAppId && String(customBotAppId).trim() === process.env.DISCORD_CLIENT_ID) {
      return NextResponse.json({ error: "That is the RoleFlow application ID and cannot be used as a custom bot." }, { status: 400 });
    }
    if (customBotAppId) {
      const taken = await prisma.guild.findFirst({
        where: { customBotAppId: String(customBotAppId).trim(), NOT: { id: params.id } },
        select: { id: true },
      });
      if (taken) {
        return NextResponse.json({ error: "That bot application is already connected to another community." }, { status: 409 });
      }
    }
    if (webhookUrl) {
      try {
        const u = new URL(String(webhookUrl).trim());
        const okHost = ["discord.com", "discordapp.com"].includes(u.hostname);
        if (u.protocol !== "https:" || !okHost || !u.pathname.startsWith("/api/webhooks/")) throw new Error("bad");
      } catch {
        return NextResponse.json({ error: "The webhook must be a https://discord.com/api/webhooks/... URL." }, { status: 400 });
      }
    }

    // Check slug uniqueness if changed
    if (vanitySlug && vanitySlug !== guild.vanitySlug) {
      const cleanSlug = vanitySlug.toLowerCase().replace(/[^a-z0-9-]/g, "").trim();
      const existingSlug = await prisma.guild.findUnique({
        where: { vanitySlug: cleanSlug },
      });
      if (existingSlug && existingSlug.id !== params.id) {
        return NextResponse.json({ error: "That vanity URL slug is already taken." }, { status: 400 });
      }
    }

    // Guild settings update
    const updated = await prisma.guild.update({
      where: { id: params.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(vanitySlug !== undefined ? { vanitySlug: vanitySlug?.trim() || null } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(tags !== undefined ? { tags: tags?.trim() || null } : {}),
        ...(icon !== undefined ? { icon: icon?.trim() || null } : {}),
        ...(banner !== undefined ? { banner: banner?.trim() || null } : {}),
        ...(typeof requireInGuild === "boolean" ? { requireInGuild } : {}),
        ...(minAccountAgeDays !== undefined ? { minAccountAgeDays: Number(minAccountAgeDays) || 0 } : {}),
        ...(cooldownDays !== undefined ? { cooldownDays: Number(cooldownDays) } : {}),
        ...(typeof enableRobloxAuth === "boolean" ? { enableRobloxAuth } : {}),
        ...(typeof enableRobloxGroupCheck === "boolean" ? { enableRobloxGroupCheck } : {}),
        ...(robloxGroupId !== undefined ? { robloxGroupId: robloxGroupId?.trim() || null } : {}),
        ...(robloxMinRank !== undefined ? { robloxMinRank: Number(robloxMinRank) || 1 } : {}),
        ...(robloxMinAccountAgeDays !== undefined ? { robloxMinAccountAgeDays: Math.max(0, Number(robloxMinAccountAgeDays) || 0) } : {}),
        ...(robloxAcceptRankId !== undefined ? { robloxAcceptRankId: robloxAcceptRankId !== null && robloxAcceptRankId !== "" ? Number(robloxAcceptRankId) : null } : {}),
        ...(robloxRequiredBadgeId !== undefined ? { robloxRequiredBadgeId: robloxRequiredBadgeId?.trim() || null } : {}),
        ...(robloxCloudApiKey !== undefined && robloxCloudApiKey !== "" ? { robloxCloudApiKey: encryptSecret(String(robloxCloudApiKey).trim()) } : {}),
        ...(robloxCloudApiKey === null ? { robloxCloudApiKey: null } : {}),
        ...(typeof enableBlindVoting === "boolean" ? { enableBlindVoting } : {}),
        ...(votePassThreshold !== undefined ? { votePassThreshold: Number(votePassThreshold) || 2 } : {}),
        ...(typeof useCustomBot === "boolean" ? { useCustomBot } : {}),
        ...(customBotToken !== undefined && customBotToken !== "" ? { customBotToken: encryptSecret(String(customBotToken).trim()) } : {}),
        ...(customBotToken === null ? { customBotToken: null } : {}),
        ...(logChannelId !== undefined ? { logChannelId: logChannelId?.trim() || null } : {}),
        ...(staffPingRoleId !== undefined ? { staffPingRoleId: staffPingRoleId?.trim() || null } : {}),
        ...(embedColor ? { embedColor: embedColor.trim() } : {}),
        ...(webhookUrl !== undefined ? { webhookUrl: webhookUrl?.trim() || null } : {}),
        ...(portalTheme !== undefined ? { portalTheme: portalTheme?.trim() || "obsidian" } : {}),
        ...(["banner", "minimal", "cards"].includes(portalLayout) ? { portalLayout } : {}),
        ...(portalAccentColor !== undefined ? { portalAccentColor: portalAccentColor?.trim() || "#8B5CF6" } : {}),
        ...(typeof discordWidgetEnabled === "boolean" ? { discordWidgetEnabled } : {}),
        ...(typeof applicationsOpen === "boolean" ? { applicationsOpen } : {}),
        ...(typeof showApplicantCount === "boolean" ? { showApplicantCount } : {}),
        ...(welcomeMessage !== undefined ? { welcomeMessage: String(welcomeMessage || "").trim() || null } : {}),
        ...(websiteUrl !== undefined ? { websiteUrl: String(websiteUrl || "").trim() || null } : {}),
        ...(discordInviteUrl !== undefined ? { discordInviteUrl: String(discordInviteUrl || "").trim() || null } : {}),
        ...(customBotAppId !== undefined ? { customBotAppId: String(customBotAppId || "").trim() || null } : {}),
        ...(customBotPublicKey !== undefined ? { customBotPublicKey: String(customBotPublicKey || "").trim() || null } : {}),
      },
    });

    return NextResponse.json({ success: true, guild: sanitizeGuild(updated, { keepLicense: true }) });
  } catch (err: any) {
    console.error("Settings save error:", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
