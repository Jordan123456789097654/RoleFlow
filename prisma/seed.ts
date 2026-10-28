import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Cleaning and seeding RoleFlow database...");

  // 1. Delete all old placeholder demo guilds and fake applicants if they exist
  const placeholderGuildIds = ["meridian_studios", "lucid_lighting", "zz_removed_test"];
  for (const pId of placeholderGuildIds) {
    try {
      await prisma.application.deleteMany({ where: { position: { guildId: pId } } });
      await prisma.question.deleteMany({ where: { position: { guildId: pId } } });
      await prisma.position.deleteMany({ where: { guildId: pId } });
      await prisma.blacklist.deleteMany({ where: { guildId: pId } });
      await prisma.guild.deleteMany({ where: { id: pId } });
      console.log(`Deleted placeholder guild: ${pId}`);
    } catch (e) {}
  }

  // Delete fake test applicants
  try {
    await prisma.user.deleteMany({
      where: { id: { in: ["applicant_pixel", "applicant_nova", "dev_admin_user"] } },
    });
  } catch (e) {}

  // 2. Ensure Jordan (Site Owner) is registered and granted isSiteAdmin: true
  const jordanDiscordId = "1046538179399929957";
  const jordanUser = await prisma.user.upsert({
    where: { id: jordanDiscordId },
    update: { isSiteAdmin: true },
    create: {
      id: jordanDiscordId,
      username: "Jordan",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      robloxUsername: "JordanDev",
      isSiteAdmin: true,
    },
  });

  // 3. Ensure the official RoleFlow server is registered
  const officialServerId = "1565063649679122684";
  const roleflowOfficial = await prisma.guild.upsert({
    where: { id: officialServerId },
    update: {
      ownerId: jordanUser.id,
      name: "RoleFlow Official",
      vanitySlug: "roleflow",
      isVerified: true,
      verifiedBadge: "OFFICIAL",
    },
    create: {
      id: officialServerId,
      name: "RoleFlow Official",
      vanitySlug: "roleflow",
      ownerId: jordanUser.id,
      isVerified: true,
      verifiedBadge: "OFFICIAL",
      memberCount: 1,
      tags: "Recruitment,Discord,Roblox,Official",
      description: "Official RoleFlow community server. Recruitment, staff applications, developer portal, and community support.",
      banner: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
      icon: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
      cooldownDays: 7,
      enableRobloxAuth: true,
      enableBlindVoting: false,
      useCustomBot: false,
    },
  });

  // 4. Create sample real positions for the official server if none exist
  const existingPositions = await prisma.position.count({ where: { guildId: officialServerId } });
  if (existingPositions === 0) {
    await prisma.position.create({
      data: {
        guildId: officialServerId,
        title: "Community Moderator",
        department: "Moderation",
        description: "Maintain community safety, moderate active Discord channels, and support creators using RoleFlow.",
        isPublic: true,
        isOpen: true,
        questions: {
          create: [
            {
              order: 0,
              label: "What is your Discord username?",
              description: "Used to ping you and verify roles.",
              type: "TEXT",
              required: true,
            },
            {
              order: 1,
              label: "Weekly Availability",
              description: "How many hours per week can you dedicate to moderation?",
              type: "SELECT",
              options: JSON.stringify(["5-10 Hours", "10-20 Hours", "20+ Hours"]),
              required: true,
            },
            {
              order: 2,
              label: "Past Moderation Experience",
              description: "Describe any previous communities or staff roles you have held.",
              type: "LONG_TEXT",
              required: true,
            },
          ],
        },
      },
    });

    await prisma.position.create({
      data: {
        guildId: officialServerId,
        title: "Roblox Studio Developer",
        department: "Development",
        description: "Build immersive experiences, write optimized Luau code, or design 3D models.",
        isPublic: true,
        isOpen: true,
        questions: {
          create: [
            {
              order: 0,
              label: "Roblox Profile or DevForum URL",
              type: "TEXT",
              required: true,
            },
            {
              order: 1,
              label: "Primary Specialization",
              type: "SELECT",
              options: JSON.stringify(["Luau Scripting", "3D Modeling / Blender", "UI/UX Design", "Building / Level Design"]),
              required: true,
            },
            {
              order: 2,
              label: "Portfolio Showcase",
              description: "Describe your recent projects and links to your work.",
              type: "LONG_TEXT",
              required: true,
            },
          ],
        },
      },
    });
  }

  console.log("✅ RoleFlow database cleaned and initialized with zero placeholder data!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
