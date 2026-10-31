import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ButtonInteraction,
  type ModalSubmitInteraction,
  type TextChannel,
  type GuildMember,
} from "discord.js";
import type { BotConfig } from "./config";

export interface InitiateResponse {
  robloxId?: string;
  robloxUsername?: string;
  safeword?: string;
  expiresAt?: string;
  error?: string;
}

export interface ConfirmResponse {
  success: boolean;
  robloxId?: string;
  robloxUsername?: string;
  userId?: string;
  reason?: string;
  expectedSafeword?: string;
  error?: string;
}

export interface CheckVerificationResponse {
  linked: boolean;
  user?: {
    id: string;
    username: string;
    robloxId: string;
    robloxUsername: string;
  };
}

/**
 * Creates the persistent verification embed for VERIFY_CHANNEL_ID.
 */
export function createVerificationEmbed() {
  const embed = new EmbedBuilder()
    .setTitle("Roblox Account Verification")
    .setDescription(
      "Link your Roblox account to gain access to the RoleFlow community server.\n\n" +
        "**Instructions:**\n" +
        "1. Click the **Verify Roblox Account** button below.\n" +
        "2. Enter your Roblox username.\n" +
        "3. You will receive a unique safeword phrase to put into your Roblox profile bio.\n" +
        "4. Click **Confirm Verification** to finish linking your account."
    )
    .setColor(0x3b82f6)
    .setFooter({ text: "RoleFlow Verification System" });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("verify_start_btn")
      .setLabel("Verify Roblox Account")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🔒")
  );

  return { embeds: [embed], components: [row] };
}

/**
 * Creates the modal for entering Roblox username.
 */
export function createUsernameModal(): ModalBuilder {
  const modal = new ModalBuilder()
    .setCustomId("verify_username_modal")
    .setTitle("Enter Roblox Username");

  const input = new TextInputBuilder()
    .setCustomId("roblox_username_input")
    .setLabel("Roblox Username")
    .setPlaceholder("e.g. Builderman")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(3)
    .setMaxLength(30);

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(input);
  modal.addComponents(row);

  return modal;
}

/**
 * Client for RoleFlow ApplyHub verification API.
 */
export class VerificationApiClient {
  private apiBase: string;
  private botSecret: string;
  private fetchFn: typeof fetch;

  constructor(apiBase: string, botSecret: string, fetchFn: typeof fetch = fetch) {
    this.apiBase = apiBase.replace(/\/+$/, "");
    this.botSecret = botSecret;
    this.fetchFn = fetchFn;
  }

  async checkStatus(discordId: string): Promise<CheckVerificationResponse> {
    const res = await this.fetchFn(`${this.apiBase}/api/bot/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.botSecret}`,
      },
      body: JSON.stringify({ discordId }),
    });

    if (!res.ok) {
      throw new Error(`Failed to check verification status: ${res.status}`);
    }

    return (await res.json()) as CheckVerificationResponse;
  }

  async initiate(discordId: string, robloxUsername: string): Promise<InitiateResponse> {
    const res = await this.fetchFn(`${this.apiBase}/api/bot/verify/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.botSecret}`,
      },
      body: JSON.stringify({ discordId, robloxUsername }),
    });

    return (await res.json()) as InitiateResponse;
  }

  async confirm(discordId: string): Promise<ConfirmResponse> {
    const res = await this.fetchFn(`${this.apiBase}/api/bot/verify/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.botSecret}`,
      },
      body: JSON.stringify({ discordId }),
    });

    return (await res.json()) as ConfirmResponse;
  }

}

/**
 * Deploys or updates the persistent verification message in VERIFY_CHANNEL_ID.
 */
export async function ensureVerificationMessage(channel: TextChannel) {
  try {
    const messages = await channel.messages.fetch({ limit: 10 });
    const existing = messages.find((m) => m.author.id === channel.client.user?.id && m.components.length > 0);
    const payload = createVerificationEmbed();

    if (existing) {
      await existing.edit(payload);
    } else {
      await channel.send(payload);
    }
  } catch (err) {
    console.error("[VERIFICATION] Failed to ensure verification message:", err);
  }
}

/**
 * Handles the "Verify Roblox Account" button click.
 */
export async function handleVerifyButtonClick(
  interaction: ButtonInteraction,
  apiClient: VerificationApiClient,
  config: BotConfig
) {
  // Check if member already has verified role or is already linked in API
  const member = interaction.member as GuildMember | null;
  if (member?.roles.cache.has(config.verifiedRoleId)) {
    return interaction.reply({
      content: "✅ You are already verified in this server!",
      ephemeral: true,
    });
  }

  try {
    const status = await apiClient.checkStatus(interaction.user.id);
    if (status.linked && status.user) {
      // User is already linked in database; sync role & nickname
      await applyVerifiedMemberSync(member, status.user.robloxUsername, config.verifiedRoleId);
      return interaction.reply({
        content: `✅ Your Discord account is already linked to **${status.user.robloxUsername}**! Your roles and nickname have been updated.`,
        ephemeral: true,
      });
    }
  } catch {
    // If status check fails, allow user to continue through normal flow
  }

  const modal = createUsernameModal();
  await interaction.showModal(modal);
}

/**
 * Handles the submission of the username modal.
 */
export async function handleUsernameModalSubmit(
  interaction: ModalSubmitInteraction,
  apiClient: VerificationApiClient
) {
  const robloxUsername = interaction.fields.getTextInputValue("roblox_username_input").trim();

  await interaction.deferReply({ ephemeral: true });

  const result = await apiClient.initiate(interaction.user.id, robloxUsername);

  if (result.error || !result.safeword) {
    return interaction.editReply({
      content: `❌ Verification failed: ${result.error || "Unable to find Roblox user."}`,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle("Set Your Roblox Bio")
    .setDescription(
      `Please paste the following safeword phrase anywhere in your Roblox profile's **About** / **Bio** section:\n\n` +
        `\`\`\`\n${result.safeword}\n\`\`\`\n\n` +
        `**Profile:** [Roblox Profile](https://www.roblox.com/users/${result.robloxId}/profile)\n` +
        `**Roblox User:** **${result.robloxUsername}**\n\n` +
        `Once added, click **Confirm Verification** below.`
    )
    .setColor(0xeab308)
    .setFooter({ text: "This safeword expires in 15 minutes." });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("verify_confirm_btn")
      .setLabel("Confirm Verification")
      .setStyle(ButtonStyle.Success)
      .setEmoji("✅")
  );

  await interaction.editReply({
    embeds: [embed],
    components: [row],
  });
}

/**
 * Handles clicking the "Confirm Verification" button.
 */
export async function handleConfirmButtonClick(
  interaction: ButtonInteraction,
  apiClient: VerificationApiClient,
  config: BotConfig
) {
  await interaction.deferReply({ ephemeral: true });

  const member = interaction.member as GuildMember | null;
  const result = await apiClient.confirm(interaction.user.id);

  if (!result.success) {
    if (result.reason === "SAFEWORD_NOT_FOUND") {
      return interaction.editReply({
        content:
          `❌ We could not find the safeword in your Roblox profile bio.\n\n` +
          `Expected phrase: \`${result.expectedSafeword}\`\n\n` +
          `Please ensure you saved your profile description and click **Confirm Verification** again.`,
      });
    }

    return interaction.editReply({
      content: `❌ Verification could not be confirmed: ${result.reason || result.error || "Unknown error"}`,
    });
  }

  // Verification succeeded!
  const verifiedUsername = result.robloxUsername || "Verified Member";
  const syncResult = await applyVerifiedMemberSync(member, verifiedUsername, config.verifiedRoleId);

  const celebrationEmbed = new EmbedBuilder()
    .setTitle("🎉 Verification Successful!")
    .setDescription(
      `Welcome, **${verifiedUsername}**!\n\n` +
        `Your Roblox account has been successfully linked. You have received the verified role and full access to the server.`
    )
    .setColor(0x22c55e)
    .setFooter({ text: "RoleFlow Verification" });

  let note = "";
  if (!syncResult.nicknameUpdated) {
    note = "\n*(Note: Could not update server nickname due to role hierarchy)*";
  }

  await interaction.editReply({
    content: `Verification complete!${note}`,
    embeds: [celebrationEmbed],
    components: [],
  });
}

/**
 * Pure/isolated helper to assign verified role and nickname.
 */
export async function applyVerifiedMemberSync(
  member: GuildMember | null,
  robloxUsername: string,
  verifiedRoleId: string
): Promise<{ roleAssigned: boolean; nicknameUpdated: boolean }> {
  let roleAssigned = false;
  let nicknameUpdated = false;

  if (!member) {
    return { roleAssigned, nicknameUpdated };
  }

  try {
    if (!member.roles.cache.has(verifiedRoleId)) {
      await member.roles.add(verifiedRoleId);
      roleAssigned = true;
    } else {
      roleAssigned = true;
    }
  } catch (err) {
    console.error("[VERIFICATION SYNC] Failed to add verified role:", err);
  }

  try {
    if (member.nickname !== robloxUsername) {
      await member.setNickname(robloxUsername);
      nicknameUpdated = true;
    } else {
      nicknameUpdated = true;
    }
  } catch {
    // Expected if bot is lower than user in role hierarchy or user is server owner
    nicknameUpdated = false;
  }

  return { roleAssigned, nicknameUpdated };
}
