/**
 * Lists the most recent communities with their public text so suspicious ones can be
 * reviewed (fake login pages, giveaways, "verify your account" copy, etc.).
 * Usage: npx tsx scripts/review-communities.ts [limit]
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const limit = Number(process.argv[2] || 50);
  const guilds = await prisma.guild.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      vanitySlug: true,
      description: true,
      ownerId: true,
      isPaused: true,
      createdAt: true,
      positions: { select: { title: true, description: true } },
    },
  });

  for (const g of guilds) {
    console.log("─".repeat(72));
    console.log(`${g.createdAt.toISOString().slice(0, 10)}  ${g.name}  /c/${g.vanitySlug ?? "-"}  owner=${g.ownerId}${g.isPaused ? "  [PAUSED]" : ""}`);
    if (g.description) console.log(`  about: ${g.description.slice(0, 240)}`);
    for (const p of g.positions) console.log(`  position: ${p.title} — ${p.description.slice(0, 160)}`);
  }
  console.log("─".repeat(72));
  console.log(`${guilds.length} communities shown. To hide one, set isPaused = true for its id in the admin console.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
