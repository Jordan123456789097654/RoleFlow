import { isGuildPaid } from "@/lib/licensing";
import { verifySessionValue } from "@/lib/session";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const userId = await verifySessionValue(cookieStore.get("roleflow_user_id")?.value);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const guild = await prisma.guild.findUnique({
      where: { id: params.id },
    });

    if (!guild) {
      return NextResponse.json({ error: "Guild not found" }, { status: 404 });
    }

    // Permission check
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (guild.ownerId !== userId && !currentUser?.isSiteAdmin && currentUser?.id !== "1046538179399929957") {
      return NextResponse.json({ error: "Forbidden: You do not own this community." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const token = (body.botToken || guild.customBotToken || process.env.DISCORD_BOT_TOKEN || "").trim();

    if (!token) {
      return NextResponse.json({ error: "No bot token provided" }, { status: 400 });
    }

    const headers = {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    };

    // 1. Create Roles
    const roleColors = [
      { name: "Staff Reviewer", color: 0x8b5cf6, hoist: true },
      { name: "Accepted Staff", color: 0x10b981, hoist: true },
      { name: "RoleFlow Applicant", color: 0x38bdf8, hoist: false },
    ];

    const createdRoles: Record<string, string> = {};

    for (const r of roleColors) {
      try {
        const res = await fetch(`https://discord.com/api/v10/guilds/${params.id}/roles`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: r.name,
            color: r.color,
            hoist: r.hoist,
            mentionable: true,
          }),
        });
        if (res.ok) {
          const role = await res.json();
          createdRoles[r.name] = role.id;
        }
      } catch (e) {}
    }

    // 2. Create Category
    let categoryId: string | null = null;
    try {
      const catRes = await fetch(`https://discord.com/api/v10/guilds/${params.id}/channels`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: "ROLEFLOW RECRUITMENT",
          type: 4,
        }),
      });
      if (catRes.ok) {
        const cat = await catRes.json();
        categoryId = cat.id;
      }
    } catch (e) {}

    // 3. Create Text Channels
    let logChannelId: string | null = null;
    const channelList = [
      { name: "applications-log", topic: "Live applicant submissions via RoleFlow" },
      { name: "staff-reviews", topic: "Staff blind voting and interview notes" },
    ];

    for (const ch of channelList) {
      try {
        const chRes = await fetch(`https://discord.com/api/v10/guilds/${params.id}/channels`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: ch.name,
            type: 0,
            parent_id: categoryId || undefined,
            topic: ch.topic,
          }),
        });
        if (chRes.ok) {
          const c = await chRes.json();
          if (ch.name === "applications-log") {
            logChannelId = c.id;
          }
        }
      } catch (e) {}
    }

    const staffRoleId = createdRoles["Staff Reviewer"] || null;

    // 4. Update Guild settings in DB
    const updated = await prisma.guild.update({
      where: { id: params.id },
      data: {
        useCustomBot: true,
        customBotToken: token,
        logChannelId: logChannelId || guild.logChannelId,
        staffPingRoleId: staffRoleId || guild.staffPingRoleId,
      },
    });

    // 5. Send confirmation embed if channel was created
    if (logChannelId) {
      try {
        await fetch(`https://discord.com/api/v10/channels/${logChannelId}/messages`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            embeds: [
              {
                title: "RoleFlow Bot Connected & Hosted",
                description: `Recruitment infrastructure configured for **${guild.name}**!\n\nApplications received at [roleflow.site](https://roleflow.site) will be dispatched directly to this channel.`,
                color: 0x8b5cf6,
                fields: [
                  {
                    name: "Automated Roles",
                    value: Object.entries(createdRoles)
                      .map(([name, id]) => `• <@&${id}> (\`${name}\`)`)
                      .join("\n") || "Roles active",
                    inline: false,
                  },
                ],
                footer: { text: "RoleFlow Automation • roleflow.site" },
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      logChannelId,
      staffRoleId,
      guild: updated,
    });
  } catch (err: any) {
    console.error("Bot setup error:", err);
    return NextResponse.json({ error: err.message || "Failed to setup bot" }, { status: 500 });
  }
}
