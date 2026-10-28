import {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChatInputCommandInteraction,
  ButtonInteraction,
} from "discord.js";
import { prisma } from "../lib/prisma";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID || "123456789012345678";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message],
});

// Slash Commands definitions
const commands = [
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Configure RoleFlow staff review channel and alert settings for this community")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel where new application review embeds will be posted")
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option
        .setName("reviewer_role")
        .setDescription("Staff role allowed to review and vote on applications")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("openings")
    .setDescription("Display interactive embed of active open staff & developer positions"),

  new SlashCommandBuilder()
    .setName("apply")
    .setDescription("Get a direct link to apply for an open position"),

  new SlashCommandBuilder()
    .setName("status")
    .setDescription("Check the current status of your submitted applications"),
].map((cmd) => cmd.toJSON());

client.once("ready", async () => {
  console.log(`\n===========================================`);
  console.log(`🤖 RoleFlow Discord Client is Online! Logged in as: ${client.user?.tag}`);
  console.log(`⚡ Connected to ${client.guilds.cache.size} Discord communities`);
  console.log(`===========================================\n`);

  // Register slash commands globally or for cached guilds
  if (token && !token.includes("your_discord_bot_token")) {
    try {
      const rest = new REST({ version: "10" }).setToken(token);
      console.log("[RoleFlow] Registering global slash commands (/setup, /openings, /apply, /status)...");
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log("[RoleFlow] Successfully registered slash commands!");
    } catch (err) {
      console.warn("[RoleFlow] Slash commands registration skipped:", err);
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  // Handle Slash Commands
  if (interaction.isChatInputCommand()) {
    const cmd = interaction as ChatInputCommandInteraction;

    // 1. /setup
    if (cmd.commandName === "setup") {
      const channel = cmd.options.getChannel("channel", true);
      const role = cmd.options.getRole("reviewer_role");

      await prisma.guild.upsert({
        where: { id: cmd.guildId || "demo_guild" },
        update: {
          logChannelId: channel.id,
          reviewerRoleId: role?.id || null,
        },
        create: {
          id: cmd.guildId || "demo_guild",
          name: cmd.guild?.name || "Discord Community",
          ownerId: cmd.guild?.ownerId || cmd.user.id,
          logChannelId: channel.id,
          reviewerRoleId: role?.id || null,
        },
      });

      return cmd.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("⚙️ RoleFlow Community Setup Complete")
            .setDescription(
              `Staff application alerts will now be sent to <#${channel.id}>.\n${
                role ? `Reviewer Role: <@&${role.id}>\n` : ""
              }\nAccess your full web dashboard at: [RoleFlow Web Dashboard](${
                process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
              }/dashboard/${cmd.guildId})`
            )
            .setColor(0x8b5cf6),
        ],
        ephemeral: true,
      });
    }

    // 2. /openings
    if (cmd.commandName === "openings") {
      const guildData = await prisma.guild.findUnique({
        where: { id: cmd.guildId || "demo_guild" },
        include: {
          positions: { where: { isOpen: true } },
        },
      });

      if (!guildData || guildData.positions.length === 0) {
        return cmd.reply({
          content: "❌ There are currently no open positions for this community.",
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(`💼 ${guildData.name} — Open Positions`)
        .setDescription(
          "We are currently recruiting! Browse our open positions below and apply directly online with your Discord profile."
        )
        .setColor(0x8b5cf6)
        .setThumbnail(cmd.guild?.iconURL() || null);

      guildData.positions.forEach((pos) => {
        embed.addFields({
          name: `• ${pos.title}`,
          value: `${pos.description.slice(0, 150)}...\n👉 [**Apply Online**](${
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          }/apply/${pos.id})`,
        });
      });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel("Browse All Openings on RoleFlow")
          .setStyle(ButtonStyle.Link)
          .setURL(
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/c/${
              guildData.vanitySlug || guildData.id
            }`
          )
      );

      return cmd.reply({ embeds: [embed], components: [row] });
    }

    // 3. /apply
    if (cmd.commandName === "apply") {
      return cmd.reply({
        content: `🌐 Apply for open roles directly on our web portal: ${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/c/${cmd.guildId}`,
        ephemeral: true,
      });
    }

    // 4. /status
    if (cmd.commandName === "status") {
      const apps = await prisma.application.findMany({
        where: { userId: cmd.user.id },
        include: { position: { include: { guild: true } } },
        take: 5,
        orderBy: { createdAt: "desc" },
      });

      if (apps.length === 0) {
        return cmd.reply({
          content: "You have not submitted any applications yet.",
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle("📋 Your Active Applications")
        .setColor(0x8b5cf6);

      apps.forEach((a) => {
        embed.addFields({
          name: `${a.position.guild.name} — ${a.position.title}`,
          value: `Status: **${a.status}**\nUpdated: <t:${Math.floor(
            new Date(a.updatedAt).getTime() / 1000
          )}:R>`,
        });
      });

      return cmd.reply({ embeds: [embed], ephemeral: true });
    }
  }

  // Handle Interactive Buttons (Quick Accept / Reject from Staff Channel)
  if (interaction.isButton()) {
    const btn = interaction as ButtonInteraction;
    const customId = btn.customId;

    if (customId.startsWith("quick_accept_")) {
      const appId = customId.replace("quick_accept_", "");
      try {
        const app = await prisma.application.update({
          where: { id: appId },
          data: { status: "ACCEPTED" },
          include: { position: true, user: true },
        });

        // Grant role if configured
        if (app.position.acceptRoleId && btn.guildId) {
          try {
            const member = await btn.guild?.members.fetch(app.userId);
            if (member && app.position.acceptRoleId) {
              await member.roles.add(app.position.acceptRoleId);
            }
          } catch (e) {}
        }

        return btn.reply({
          content: `✅ <@${btn.user.id}> accepted applicant **${app.user.username}** for **${app.position.title}**!`,
        });
      } catch (err) {
        return btn.reply({ content: "Error accepting application.", ephemeral: true });
      }
    }

    if (customId.startsWith("quick_reject_")) {
      const appId = customId.replace("quick_reject_", "");
      try {
        const app = await prisma.application.update({
          where: { id: appId },
          data: { status: "REJECTED" },
          include: { position: true, user: true },
        });

        return btn.reply({
          content: `❌ <@${btn.user.id}> rejected applicant **${app.user.username}** for **${app.position.title}**.`,
        });
      } catch (err) {
        return btn.reply({ content: "Error rejecting application.", ephemeral: true });
      }
    }
  }
});

// Boot the bot if token is present
if (token && !token.includes("your_discord_bot_token")) {
  client.login(token).catch((err) => {
    console.warn("[AppliBot] Login failed (Check DISCORD_BOT_TOKEN in .env):", err.message);
  });
} else {
  console.log("[AppliBot] No live DISCORD_BOT_TOKEN provided. Running in web demo mode.");
}
