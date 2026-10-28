import { NextResponse } from "next/server";
import { createPublicKey, verify } from "crypto";
import { prisma } from "@/lib/prisma";
import { canDecideInGuild, canViewInGuild, changeApplicationStatus } from "@/lib/application-status";
import { logEvent } from "@/lib/health";

export const dynamic = "force-dynamic";

// Ed25519 SubjectPublicKeyInfo prefix; Discord sends the raw 32-byte key as hex.
const SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://roleflow.site";

function validSignature(body: string, publicKeyHex: string | null, signature: string | null, timestamp: string | null): boolean {
  if (!publicKeyHex || !signature || !timestamp) return false;
  try {
    const key = createPublicKey({
      key: Buffer.concat([SPKI_PREFIX, Buffer.from(publicKeyHex, "hex")]),
      format: "der",
      type: "spki",
    });
    return verify(null, Buffer.from(timestamp + body), key, Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

/** The official bot uses the platform key. A community bot uses the key its owner saved for that application. */
async function publicKeyFor(applicationId: string | undefined): Promise<string | null> {
  if (!applicationId) return null;
  if (applicationId === process.env.DISCORD_CLIENT_ID) return process.env.DISCORD_PUBLIC_KEY || null;
  const guild = await prisma.guild.findFirst({
    where: { customBotAppId: applicationId },
    select: { customBotPublicKey: true },
  });
  return guild?.customBotPublicKey ?? null;
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

  const key = await publicKeyFor(parsed.application_id);
  if (!validSignature(raw, key, request.headers.get("x-signature-ed25519"), request.headers.get("x-signature-timestamp"))) {
    await logEvent("WARN", "interactions", `Rejected request with invalid signature (application ${parsed.application_id ?? "unknown"})`);
    return new NextResponse("invalid request signature", { status: 401 });
  }

  const i = parsed;
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
        where: { userId: discordUserId },
        include: { position: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
      if (apps.length === 0) return ephemeral("You have no applications on RoleFlow yet.");
      return ephemeral(apps.map((a) => `• **${a.position.title}**: \`${a.status}\``).join("\n"));
    }

    if (name === "openings") {
      if (!guildId) return ephemeral("Run this command inside a server.");
      const positions = await prisma.position.findMany({ where: { guildId, isOpen: true }, select: { title: true } });
      if (positions.length === 0) return ephemeral("No open positions right now.");
      return ephemeral(positions.map((p) => `• **${p.title}**`).join("\n"));
    }

    if (name === "apply") {
      const guild = guildId ? await prisma.guild.findUnique({ where: { id: guildId }, select: { vanitySlug: true } }) : null;
      const url = guild?.vanitySlug ? `${APP_URL}/c/${guild.vanitySlug}` : `${APP_URL}/browse`;
      return ephemeral(`Apply here: ${url}`);
    }

    if (name === "help") {
      return ephemeral(
        "**Applicants:** `/status`, `/openings`, `/apply`\n" +
        "**Staff:** `/pending`, `/stats`, `/accept <application_id> [note]`, `/reject <application_id> [note]`"
      );
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
