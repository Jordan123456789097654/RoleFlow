import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChangelogBroadcastModal } from "@/components/ChangelogBroadcastModal";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "RoleFlow — The New Way of Managing Applications",
  description:
    "Communities post openings. People apply once. Staff review, interview, and decide in one place instead of drowning in Discord DMs.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-slate-100 flex flex-col relative antialiased selection:bg-purple-600 selection:text-white">
        {/* Background ambient radial glow and grid */}
        <div className="ambient-glow" />
        <div className="fixed inset-0 bg-grid-pattern pointer-events-none opacity-40 z-0" />

        <div className="relative z-10 flex flex-col min-h-screen">
          <ChangelogBroadcastModal />
          <Navbar user={user} />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
