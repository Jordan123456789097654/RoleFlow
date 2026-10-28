import { NextResponse } from "next/server";
import { createPublicKey, verify } from "crypto";
import { prisma } from "@/lib/prisma";
import { canDecideInGuild, changeApplicationStatus } from "@/lib/application-status";
import { logEvent } from "@/lib/health";

export const dynamic = "force-dynamic";

// Ed25519 SubjectPublicKeyInfo prefix; Discord sends the raw 32-byte key as hex.
const SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://roleflow.site";

function validSignature(body: string, signature: string | null, timestamp: string | null): boolean {
  const pub = process.env.DISCORD_PUBLIC_KEY;
  if (!pub || !signature || !timestamp) return false;
  try {
    const key = createPublicKey({
      key: Buffer.concat([SPKI_PREFIX, Buffer.from(pub, "hex")]),
      format: "der",
      type: "spki",
    });
    return verify(null, Buffer.from(timestamp + body), key, Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

const ephemeral = (content: string) => NextResponse.json({ type: 4, data: { content, flags: 64 } });

/** Discord Interactions endpoint: slash commands and the Quick Accept / Quick Reject buttons. */
export async function POST(request: Request) {
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("x-signature-ed25519"), request.headers.get("x-signature-timestamp"))) {
    await logEvent("WARN", "interactions", "Rejected request with invalid signature");
    return new NextResponse("invalid request signature", { status: 401 });
  }

  const i = JSON.parse(raw);
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
      const positions = await prisma.position.findMany({
        where: { guildId, isOpen: true },
        select: { title: true },
      });
      if (positions.length === 0) return ephemeral("No open positions right now.");
      return ephemeral(positions.map((p) => `• **${p.title}**`).join("\n"));
    }

    if (name === "apply") {
      const guild = guildId ? await prisma.guild.findUnique({ where: { id: guildId }, select: { vanitySlug: true } }) : null;
      const url = guild?.vanitySlug ? `${APP_URL}/c/${guild.vanitySlug}` : `${APP_URL}/browse`;
      return ephemeral(`Apply here: ${url}`);
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
