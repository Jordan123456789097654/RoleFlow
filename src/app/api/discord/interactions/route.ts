import { openNowWhere } from "@/lib/position-availability";
import { discordAccountCreatedAt } from "@/lib/signals";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canDecideInGuild, canViewInGuild, changeApplicationStatus } from "@/lib/application-status";
import { logEvent } from "@/lib/health";
import { validSignature } from "@/lib/discord-signature";
import { publicGuildUrl } from "@/lib/custom-domain";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://roleflow.site";


type BotBinding = { publicKey: string | null; boundGuildId: string | null };

/**
 * The official bot uses the platform key and may act in any guild it is installed in.
 * A community bot uses the key its owner saved, and is bound to THAT community only:
 * without the binding, anyone who registers their own bot could sign requests claiming to be
 * staff of any other community.
 */
async function bindingFor(applicationId: string | undefined): Promise<BotBinding | null> {
  if (!applicationId) return null;
  if (applicationId === process.env.DISCORD_CLIENT_ID) {
    return { publicKey: process.env.DISCORD_PUBLIC_KEY || null, boundGuildId: null };
  }
  const guild = await prisma.guild.findUnique({
    where: { customBotAppId: applicationId },
    select: { id: true, customBotPublicKey: true, useCustomBot: true },
  });
  if (!guild || !guild.useCustomBot) return null;
  return { publicKey: guild.customBotPublicKey ?? null, boundGuildId: guild.id };
}

const ephemeral = (content: string) => NextResponse.json({ type: 4, data: { content, flags: 64 } });

/** Discord Interactions endpoint: slash commands and the Quick Accept / Quick Reject buttons. */
export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new NextResponse("invalid body", { status: 400 });
  }

  const binding = await bindingFor(parsed.application_id);
  const timestamp = request.headers.get("x-signature-timestamp");
  const fresh = timestamp !== null && Math.abs(Date.now() / 1000 - Number(timestamp)) < 300; // reject replays
  if (!fresh || !validSignature(raw, binding?.publicKey ?? null, request.headers.get("x-signature-ed25519"), timestamp)) {
    await logEvent("WARN", "interactions", `Rejected request with invalid signature (application ${parsed.application_id ?? "unknown"})`);
    return new NextResponse("invalid request signature", { status: 401 });
  }

  const i = parsed;
  const boundGuildId = binding?.boundGuildId ?? null;

  // A community bot may only ever act inside its own community.
  if (i.type !== 1 && boundGuildId && i.guild_id !== boundGuildId) {
    return ephemeral("This bot only works inside its own community server.");
  }

  if (i.type === 1) {
    await logEvent("INFO", "interactions", "Heartbeat: Discord PING verified");
    return NextResponse.json({ type: 1 });
  }

  const discordUserId: string | undefined = i.member?.user?.id ?? i.user?.id;
  const guildId: string | undefined = i.guild_id;

  if (i.type === 2) {
    const name = i.data?.name;

    if (name === "status") {
      if (!discordUserId) return ephemeral("Could not identify you.");
      const apps = await prisma.application.findMany({
        where: { userId: discordUserId, ...(boundGuildId ? { position: { guildId: boundGuildId } } : {}) },
        include: { position: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
      if (apps.length === 0) return ephemeral("You have no applications on RoleFlow yet.");
      return ephemeral(apps.map((a) => `• **${a.position.title}**: \`${a.status}\``).join("\n"));
    }

    if (name === "openings") {
      if (!guildId) return ephemeral("Run this command inside a server.");
      const positions = await prisma.position.findMany({ where: { guildId, ...openNowWhere() }, select: { title: true } });
      if (positions.length === 0) return ephemeral("No open positions right now.");
      return ephemeral(positions.map((p) => `• **${p.title}**`).join("\n"));
    }

    if (name === "apply") {
      const guild = guildId
        ? await prisma.guild.findUnique({
            where: { id: guildId },
            select: { id: true, vanitySlug: true, customDomain: true, customDomainVerified: true },
          })
        : null;
      const url = guild ? publicGuildUrl(guild) : `${APP_URL}/browse`;
      return ephemeral(`Apply here: ${url}`);
    }

    if (name === "help") {
      return ephemeral(
        "**Applicants:** `/status`, `/openings`, `/apply`\n" +
        "**Staff:** `/pending`, `/stats`, `/lookup <user>`, `/accept <application_id> [note]`, `/reject <application_id> [note]`"
      );
    }

    if (name === "lookup") {
      if (!guildId || !discordUserId) return ephemeral("Run this command inside a community server.");
      if (!(await canViewInGuild(guildId, discordUserId))) return ephemeral("Only staff can use this command.");
      const targetId = String((i.data?.options ?? []).find((o: any) => o.name === "user")?.value ?? "");
      if (!/^\d{17,20}$/.test(targetId)) return ephemeral("Pick a member to look up.");

      const [apps, person] = await Promise.all([
        prisma.application.findMany({
          where: { userId: targetId, position: { guildId } },
          include: { position: { select: { title: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.user.findUnique({ where: { id: targetId }, select: { username: true, robloxUsername: true } }),
      ]);
      const created = discordAccountCreatedAt(targetId);
      const lines = [
        `**<@${targetId}>**${person?.username ? ` (${person.username})` : ""}`,
        created ? `Discord account created <t:${Math.floor(created.getTime() / 1000)}:D> (<t:${Math.floor(created.getTime() / 1000)}:R>)` : null,
        person?.robloxUsername ? `Roblox: ${person.robloxUsername}` : "No Roblox account linked",
        "",
        apps.length === 0
          ? "No applications to this community."
          : apps.map((a) => `• \`${a.id}\` **${a.position.title}**: ${a.status}${a.waitlisted ? " (waitlist)" : ""}`).join("\n"),
      ].filter((l): l is string => l !== null);
      return ephemeral(lines.join("\n"));
    }

    if (name === "pending" || name === "stats") {
      if (!guildId || !discordUserId) return ephemeral("Run this command inside a community server.");
      if (!(await canViewInGuild(guildId, discordUserId))) return ephemeral("Only staff can use this command.");

      if (name === "stats") {
        const groups = await prisma.application.groupBy({
          by: ["status"],
          where: { position: { guildId } },
          _count: { _all: true },
        });
        if (groups.length === 0) return ephemeral("No applications yet.");
        const total = groups.reduce((n, g) => n + g._count._all, 0);
        return ephemeral(
          `**${total} applications**\n` + groups.map((g) => `• ${g.status.replace("_", " ").toLowerCase()}: ${g._count._all}`).join("\n")
        );
      }

      const waiting = await prisma.application.findMany({
        where: { position: { guildId }, status: { in: ["PENDING", "UNDER_REVIEW", "INTERVIEW"] } },
        include: { user: { select: { username: true } }, position: { select: { title: true } } },
        orderBy: { createdAt: "asc" },
        take: 10,
      });
      if (waiting.length === 0) return ephemeral("Nothing is waiting for review.");
      return ephemeral(
        waiting
          .map((a) => {
            const days = Math.floor((Date.now() - a.createdAt.getTime()) / 86_400_000);
            return `• \`${a.id}\` **${a.user.username}** for ${a.position.title} (${days}d)`;
          })
          .join("\n")
      );
    }

    if (name === "ping") {
      return ephemeral("🏓 **Pong!** RoleFlow bot is connected and responsive.");
    }

    if (name === "portal") {
      if (!guildId) return ephemeral(`Visit RoleFlow at ${APP_URL}`);
      const g = await prisma.guild.findUnique({
        where: { id: guildId },
        select: { id: true, vanitySlug: true, name: true, customDomain: true, customDomainVerified: true },
      });
      const portalUrl = g ? publicGuildUrl(g) : `${APP_URL}/c/${guildId}`;
      return ephemeral(`**${g?.name || "Community"} Application Portal:**\n🔗 Apply: <${portalUrl}>\n📊 Dashboard: <${APP_URL}/dashboard/${guildId}>`);
    }

    if (name === "interview" || name === "hold") {
      if (!guildId || !discordUserId) return ephemeral("Run this command inside a community server.");
      const options: Array<{ name: string; value: string }> = i.data?.options || [];
      const applicationId = options.find((o) => o.name === "application_id")?.value?.trim();
      const note = options.find((o) => o.name === "note")?.value?.trim();
      if (!applicationId) return ephemeral("Give the application ID from /pending.");

      const app = await prisma.application.findUnique({
        where: { id: applicationId },
        select: { position: { select: { guildId: true } } },
      });
      if (!app || app.position.guildId !== guildId) return ephemeral("No application with that ID in this community.");
      if (!(await canDecideInGuild(guildId, discordUserId))) {
        return ephemeral("You don't have decision permission for this community on RoleFlow.");
      }

      const status = name === "interview" ? "INTERVIEW" : "UNDER_REVIEW";
      const updated = await changeApplicationStatus({
        applicationId,
        status,
        decisionNote: note || (name === "hold" ? "Marked on hold / under review via Discord." : null),
        actorId: discordUserId,
        actorName: i.member?.user?.username || "Discord staff",
      });
      if (!updated) return ephemeral("This application no longer exists.");
      return ephemeral(`Application \`${applicationId}\` moved to **${status}**.`);
    }

    if (name === "accept" || name === "reject") {
      if (!guildId || !discordUserId) return ephemeral("Run this command inside a community server.");
      const options: Array<{ name: string; value: string }> = i.data?.options || [];
      const applicationId = options.find((o) => o.name === "application_id")?.value?.trim();
      const note = options.find((o) => o.name === "note")?.value?.trim();
      if (!applicationId) return ephemeral("Give the application ID from /pending.");

      const app = await prisma.application.findUnique({
        where: { id: applicationId },
        select: { position: { select: { guildId: true } } },
      });
      if (!app || app.position.guildId !== guildId) return ephemeral("No application with that ID in this community.");
      if (!(await canDecideInGuild(guildId, discordUserId))) {
        return ephemeral("You don't have decision permission for this community on RoleFlow.");
      }

      const status = name === "accept" ? "ACCEPTED" : "REJECTED";
      const updated = await changeApplicationStatus({
        applicationId,
        status,
        decisionNote: note || null,
        actorId: discordUserId,
        actorName: i.member?.user?.username || "Discord staff",
      });
      if (!updated) return ephemeral("This application no longer exists.");
      return ephemeral(`Application \`${applicationId}\` marked **${status}**.`);
    }

    return ephemeral("Unknown command.");
  }

  if (i.type === 3) {
    // custom_id format: "rf:<accept|reject>:<applicationId>"
    const [prefix, action, applicationId] = String(i.data?.custom_id || "").split(":");
    if (prefix !== "rf" || !["accept", "reject"].includes(action) || !applicationId || !discordUserId) {
      return ephemeral("Unknown action.");
    }

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { position: { select: { guildId: true } } },
    });
    if (!app) return ephemeral("This application no longer exists.");
    if (boundGuildId && app.position.guildId !== boundGuildId) return ephemeral("This application no longer exists.");

    // The button must be clicked in the guild the application belongs to.
    if (i.guild_id !== app.position.guildId) return ephemeral("Use this button in the community's own server.");

    if (!(await canDecideInGuild(app.position.guildId, discordUserId))) {
      return ephemeral("You don't have decision permission for this community on RoleFlow.");
    }

    const status = action === "accept" ? "ACCEPTED" : "REJECTED";
    const updated = await changeApplicationStatus({
      applicationId,
      status,
      actorId: discordUserId,
      actorName: i.member?.user?.username || "Discord staff",
    });
    if (!updated) return ephemeral("This application no longer exists.");
    return ephemeral(`Application marked **${status}**.`);
  }

  return ephemeral("Unsupported interaction.");
}
