import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChangelogBroadcastModal } from "@/components/ChangelogBroadcastModal";
import { BetaBanner } from "@/components/BetaBanner";
import { ModerationPunishmentBanner } from "@/components/ModerationPunishmentBanner";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
import { DomainHeader, DomainFooter, type DomainBrand } from "@/components/domain/DomainChrome";
import { getCurrentUser } from "@/lib/auth";
import { isPlatformHost, guildForCustomDomain, normalizeDomain } from "@/lib/custom-domain";
import { prisma } from "@/lib/prisma";
import { readSiteConfig } from "@/lib/site-config";

const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap", axes: ["opsz"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "RoleFlow — The New Way of Managing Applications",
  description:
    "Communities post openings. People apply once. Staff review, interview, and decide in one place instead of drowning in Discord DMs.",
  icons: {
    icon: [
      { url: "/favicon.ico?v=3", sizes: "any" },
      { url: "/icon-32.png?v=3", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png?v=3", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png?v=3", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=3", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico?v=3",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#090a0f" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

/** The Host header of this request, without a port. Empty when unknown. */
function requestHost(): string {
  const h = headers();
  return (h.get("x-forwarded-host") || h.get("host") || "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");
}

/** The community whose own domain this request came in on, or null on RoleFlow's own hosts. */
async function domainBrand(host: string): Promise<DomainBrand | null> {
  if (isPlatformHost(host)) return null;
  const domain = normalizeDomain(host);
  if (!domain) return null;
  const guild = await guildForCustomDomain(domain);
  if (!guild) return null;
  const g = await prisma.guild.findUnique({
    where: { id: guild.id },
    select: { name: true, icon: true, portalAccentColor: true, siteConfig: true },
  });
  return g;
}

const THEME_SCRIPT = `
  try {
    var theme = localStorage.getItem('rf_theme');
    if (theme === 'dark') {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  } catch (_) {}
`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const host = requestHost();
  const brand = await domainBrand(host);
  const onOwnDomain = !isPlatformHost(host);

  return (
    <html lang="en" className={`light ${sans.variable} ${display.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      {onOwnDomain ? (
        <body
          className="flex min-h-screen flex-col bg-paper text-ink antialiased"
          style={brand?.portalAccentColor ? ({ "--accent": brand.portalAccentColor } as React.CSSProperties) : undefined}
        >
          <a href="#main" className="skip-link">Skip to content</a>
          <MaintenanceGuard isStaffOrAdmin={Boolean(user?.isSupportStaff || user?.isSiteAdmin)}>
            <ModerationPunishmentBanner isBanned={user?.isBanned} />
            {brand && <DomainHeader brand={brand} user={user ? { username: user.username } : null} />}
            <main id="main" className="flex-1">{children}</main>
            <DomainFooter site={readSiteConfig(brand?.siteConfig)} />
          </MaintenanceGuard>
        </body>
      ) : (
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
      )}
    </html>
  );
}
