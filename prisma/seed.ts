import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding AppliX database...");

  // 1. Create or upsert Admin User (Jordan)
  const adminUser = await prisma.user.upsert({
    where: { id: "dev_admin_user" },
    update: {},
    create: {
      id: "dev_admin_user",
      username: "Jordan",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      robloxUsername: "JordanDev",
      isSiteAdmin: true,
    },
  });

  // Sample Applicants
  const applicant1 = await prisma.user.upsert({
    where: { id: "applicant_pixel" },
    update: {},
    create: {
      id: "applicant_pixel",
      username: "PixelCrafter",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      robloxUsername: "PixelDev_RBX",
    },
  });

  const applicant2 = await prisma.user.upsert({
    where: { id: "applicant_nova" },
    update: {},
    create: {
      id: "applicant_nova",
      username: "NovaBuilder",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
      robloxUsername: "Nova_Studios",
    },
  });

  // 2. Seed Communities (Matching the screenshot!)
  // Meridian Studios
  const meridian = await prisma.guild.upsert({
    where: { id: "meridian_studios" },
    update: {},
    create: {
      id: "meridian_studios",
      name: "Meridian Studios",
      vanitySlug: "meridian",
      ownerId: adminUser.id,
      isVerified: true,
      verifiedBadge: "OFFICIAL",
      memberCount: 24500,
      tags: "Roblox,Studio,Development",
      description: "Leading Roblox development studio creating next-generation open world RPGs and experiences.",
      banner: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
      icon: "https://images.unsplash.com/photo-1563089145-599997674d42?w=150&auto=format&fit=crop&q=80",
      cooldownDays: 7,
      enableRobloxAuth: true,
      enableBlindVoting: true,
    },
  });

  // Lucid Lighting
  const lucid = await prisma.guild.upsert({
    where: { id: "lucid_lighting" },
    update: {},
    create: {
      id: "lucid_lighting",
      name: "Lucid Lighting",
      vanitySlug: "lucid",
      ownerId: adminUser.id,
      isVerified: true,
      verifiedBadge: "PARTNER",
      memberCount: 18200,
      tags: "Roblox,VFX,Lighting,Tech",
      description: "Creators of advanced ambient lighting systems, shaders, and UI frameworks for immersive experiences.",
      banner: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80",
      icon: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&auto=format&fit=crop&q=80",
      cooldownDays: 14,
      enableRobloxAuth: true,
    },
  });

  // zz_removed_test
  const zzTest = await prisma.guild.upsert({
    where: { id: "zz_removed_test" },
    update: {},
    create: {
      id: "zz_removed_test",
      name: "zz_removed_test",
      vanitySlug: "zz-test",
      ownerId: adminUser.id,
      isVerified: false,
      memberCount: 4100,
      tags: "Testing,Beta,Community",
      description: "Private development sandbox community for experimental builds and testing.",
      banner: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80",
      icon: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=150&auto=format&fit=crop&q=80",
      cooldownDays: 3,
    },
  });

  // 3. Seed Positions & Questions
  // Position 1: Meridian Senior Scripter
  const pos1 = await prisma.position.upsert({
    where: { id: "pos_meridian_scripter" },
    update: {},
    create: {
      id: "pos_meridian_scripter",
      guildId: meridian.id,
      title: "Senior Luau Scripter & Systems Programmer",
      department: "Development",
      description: "We are seeking an experienced Luau programmer to architect core game loops, replication systems, and modular framework tools for our upcoming RPG release.",
      isPublic: true,
      isOpen: true,
      questions: {
        create: [
          {
            label: "Luau / Roblox Experience (Years)",
            description: "How many years have you actively developed on Roblox?",
            type: "SELECT",
            options: JSON.stringify(["1-2 Years", "3-4 Years", "5+ Years (Veteran)"]),
            required: true,
            order: 0,
          },
          {
            label: "DevForum / GitHub / Talent Hub Portfolio Link",
            description: "Provide direct URLs showcasing uncopylocked places, code repositories, or video showcases.",
            type: "PORTFOLIO",
            required: true,
            order: 1,
          },
          {
            label: "Technical Architecture Breakdown",
            description: "Explain how you manage state management and client-server synchronization across network boundaries.",
            type: "PARAGRAPH",
            required: true,
            order: 2,
          },
          {
            label: "I agree to sign an NDA regarding unannounced game assets",
            type: "CHECKBOX",
            required: true,
            order: 3,
          },
        ],
      },
    },
  });

  // Position 2: Meridian Trial Moderator
  const pos2 = await prisma.position.upsert({
    where: { id: "pos_meridian_mod" },
    update: {},
    create: {
      id: "pos_meridian_mod",
      guildId: meridian.id,
      title: "Community Trial Moderator",
      department: "Staff & Moderation",
      description: "Join our staff team to moderate our 25k+ Discord member server, maintain server safety, resolve member disputes, and assist in event coordination.",
      isPublic: true,
      isOpen: true,
      questions: {
        create: [
          {
            label: "Timezone & Active Hours",
            type: "TEXT",
            required: true,
            order: 0,
          },
          {
            label: "Conflict Escalation Scenario",
            description: "Two members are harassing each other in public chat. How do you respond?",
            type: "PARAGRAPH",
            required: true,
            order: 1,
          },
        ],
      },
    },
  });

  // Position 3: Lucid Lighting Specialist
  const pos3 = await prisma.position.upsert({
    where: { id: "pos_lucid_lighting" },
    update: {},
    create: {
      id: "pos_lucid_lighting",
      guildId: lucid.id,
      title: "Atmospheric Lighting & Shader Designer",
      department: "Design",
      description: "Design custom skyboxes, Future-is-Bright lighting presets, and post-processing color grading for AAA Roblox titles.",
      isPublic: true,
      isOpen: true,
      questions: {
        create: [
          {
            label: "Portfolio Showcase Link",
            type: "PORTFOLIO",
            required: true,
            order: 0,
          },
          {
            label: "FIB3 & Particle Experience",
            type: "PARAGRAPH",
            required: true,
            order: 1,
          },
        ],
      },
    },
  });

  // 4. Seed Applications & Reviews
  const app1 = await prisma.application.upsert({
    where: { id: "app_pixel_scripter" },
    update: {},
    create: {
      id: "app_pixel_scripter",
      positionId: pos1.id,
      userId: applicant1.id,
      status: "UNDER_REVIEW",
      answers: {
        create: [
          {
            questionId: (await prisma.question.findFirst({ where: { positionId: pos1.id, order: 0 } }))!.id,
            value: "5+ Years (Veteran)",
          },
          {
            questionId: (await prisma.question.findFirst({ where: { positionId: pos1.id, order: 1 } }))!.id,
            value: "https://devforum.roblox.com/u/PixelCrafter/summary",
          },
          {
            questionId: (await prisma.question.findFirst({ where: { positionId: pos1.id, order: 2 } }))!.id,
            value: "I utilize a custom Knit/BridgeNet architecture with client-side prediction and server rollback verification for snappy combat responsiveness.",
          },
          {
            questionId: (await prisma.question.findFirst({ where: { positionId: pos1.id, order: 3 } }))!.id,
            value: "true",
          },
        ],
      },
      reviews: {
        create: {
          reviewerId: adminUser.id,
          comment: "Outstanding technical depth and DevForum portfolio. Moving to interview stage recommended.",
          score: 5,
        },
      },
    },
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
