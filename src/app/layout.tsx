import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChangelogBroadcastModal } from "@/components/ChangelogBroadcastModal";
import { BetaBanner } from "@/components/BetaBanner";
import { ModerationPunishmentBanner } from "@/components/ModerationPunishmentBanner";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
import { getCurrentUser } from "@/lib/auth";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "RoleFlow — The New Way of Managing Applications",
  description:
    "Communities post openings. People apply once. Staff review, interview, and decide in one place instead of drowning in Discord DMs.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#090a0f",
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`dark ${sans.variable} ${display.variable}`}>
      <body className="min-h-screen bg-background text-slate-100 flex flex-col relative antialiased">
        <a href="#main" className="skip-link">Skip to content</a>

        {/* Aurora + masked grid backdrop */}
        <div className="ambient-glow" aria-hidden="true" />
        <div className="fixed inset-0 bg-grid-pattern pointer-events-none z-0" aria-hidden="true" />

        <div className="relative z-10 flex flex-col min-h-screen">
          <MaintenanceGuard isStaffOrAdmin={Boolean(user?.isSupportStaff || user?.isSiteAdmin)}>
            <ModerationPunishmentBanner isBanned={user?.isBanned} />
            <BetaBanner />
            <ChangelogBroadcastModal />
            <Navbar user={user} />
            <main id="main" className="flex-1">{children}</main>
            <Footer />
          </MaintenanceGuard>
        </div>
      </body>
    </html>
  );
}
