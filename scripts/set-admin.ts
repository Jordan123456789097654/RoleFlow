import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminId = "1046538179399929957";

  const user = await prisma.user.upsert({
    where: { id: adminId },
    update: { isSiteAdmin: true },
    create: {
      id: adminId,
      username: "Jordan",
      isSiteAdmin: true,
      robloxUsername: "JordanDev",
    },
  });

  console.log(`✅ Site Super-Admin granted to Discord ID: ${user.id} (${user.username})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
