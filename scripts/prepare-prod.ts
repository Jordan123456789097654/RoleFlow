import { execSync } from "child_process";

// Ensure DATABASE_URL is set from Vercel Postgres/Neon if needed
const dbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL;

if (dbUrl) {
  process.env.DATABASE_URL = dbUrl;
  console.log("⚡ Database connection URL detected!");

  try {
    console.log("📦 Pushing schema to production PostgreSQL...");
    execSync("npx prisma db push --accept-data-loss", {
      stdio: "inherit",
      env: process.env,
    });

    console.log("🌱 Seeding initial production data...");
    execSync("npx tsx prisma/seed.ts", {
      stdio: "inherit",
      env: process.env,
    });
  } catch (err) {
    console.warn("Database sync/seed warning (ignoring if already synced):", err);
  }
} else {
  console.warn("⚠️ No DATABASE_URL or POSTGRES_URL detected. Skipping remote push.");
}
