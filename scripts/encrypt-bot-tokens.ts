/**
 * One-time migration: encrypts any community bot tokens still stored in plaintext.
 * Run after setting ENCRYPTION_KEY (or APP_SECRET):  npx tsx scripts/encrypt-bot-tokens.ts
 * Safe to run repeatedly.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { encryptSecret } from "../src/lib/crypto";

async function main() {
  const prisma = new PrismaClient();
  const guilds = await prisma.guild.findMany({
    where: { customBotToken: { not: null } },
    select: { id: true, customBotToken: true },
  });
  let n = 0;
  for (const g of guilds) {
    if (!g.customBotToken || g.customBotToken.startsWith("enc:v1:")) continue;
    await prisma.guild.update({ where: { id: g.id }, data: { customBotToken: encryptSecret(g.customBotToken) } });
    n++;
  }
  console.log(`Encrypted ${n} of ${guilds.length} stored bot tokens.`);
  await prisma.$disconnect();
}

main();
