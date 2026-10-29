import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChangelogBroadcastModal } from "@/components/ChangelogBroadcastModal";
import { BetaBanner } from "@/components/BetaBanner";
import { ModerationPunishmentBanner } from "@/components/ModerationPunishmentBanner";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
import { getCurrentUser } from "@/lib/auth";

const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap", axes: ["opsz"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

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
  themeColor: "#f4f1ea",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body className="flex min-h-screen flex-col bg-paper text-ink antialiased">
        <a href="#main" className="skip-link">Skip to content</a>

        <MaintenanceGuard isStaffOrAdmin={Boolean(user?.isSupportStaff || user?.isSiteAdmin)}>
          <ModerationPunishmentBanner isBanned={user?.isBanned} />
          <BetaBanner />
          <ChangelogBroadcastModal />
          <Navbar user={user} />
          <main id="main" className="flex-1">{children}</main>
          <Footer />
        </MaintenanceGuard>
      </body>
    </html>
  );
}
