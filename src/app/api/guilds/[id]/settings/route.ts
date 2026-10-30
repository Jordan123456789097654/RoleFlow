import { cleanHttpsUrl } from "@/lib/site-config";
import { isFounderId } from "@/lib/roles";
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
    // Reject images that cannot be shown. Saving them silently would make the logo revert to the default.
    for (const [label, v] of [["Logo", body.icon], ["Banner", body.banner]] as const) {
      if (v !== undefined && v !== null && v !== "" && cleanHttpsUrl(v) === undefined) {
        return NextResponse.json({ error: `${label} must be a full https:// link to an image.` }, { status: 400 });
      }
    }
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
      portalTheme,
      portalLayout,
      portalAccentColor,
      discordWidgetEnabled,
      applicationsOpen,
      showApplicantCount,
      welcomeMessage,
      websiteUrl,
      discordInviteUrl,
      robloxMinAccountAgeDays,
      robloxCloudApiKey,
      robloxAcceptRankId,
      robloxRequiredBadgeId,
    } = body;


    for (const [label, value] of [["Website", websiteUrl], ["Discord invite", discordInviteUrl]] as const) {
      if (value && !/^https:\/\/[^\s]+$/.test(String(value).trim())) {
        return NextResponse.json({ error: `${label} must be a full https:// link.` }, { status: 400 });
      }
    }
    if (welcomeMessage && String(welcomeMessage).length > 500) {
      return NextResponse.json({ error: "The welcome message must be 500 characters or fewer." }, { status: 400 });
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
        ...(icon !== undefined ? { icon: cleanHttpsUrl(icon) ?? null } : {}),
        ...(banner !== undefined ? { banner: cleanHttpsUrl(banner) ?? null } : {}),
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
        ...(portalTheme !== undefined ? { portalTheme: portalTheme?.trim() || "obsidian" } : {}),
        ...(["banner", "minimal", "cards"].includes(portalLayout) ? { portalLayout } : {}),
        ...(portalAccentColor !== undefined ? { portalAccentColor: portalAccentColor?.trim() || "#8B5CF6" } : {}),
        ...(typeof discordWidgetEnabled === "boolean" ? { discordWidgetEnabled } : {}),
        ...(typeof applicationsOpen === "boolean" ? { applicationsOpen } : {}),
        ...(typeof showApplicantCount === "boolean" ? { showApplicantCount } : {}),
        ...(welcomeMessage !== undefined ? { welcomeMessage: String(welcomeMessage || "").trim() || null } : {}),
        ...(websiteUrl !== undefined ? { websiteUrl: String(websiteUrl || "").trim() || null } : {}),
        ...(discordInviteUrl !== undefined ? { discordInviteUrl: String(discordInviteUrl || "").trim() || null } : {}),
      },
    });

    return NextResponse.json({ success: true, guild: sanitizeGuild(updated, { keepLicense: true }) });
  } catch (err: any) {
    console.error("Settings save error:", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
