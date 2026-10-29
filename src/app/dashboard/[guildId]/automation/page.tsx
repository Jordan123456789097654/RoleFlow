import React from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";
import { AutomationForm } from "@/components/dashboard/AutomationForm";
import { ArrowLeft } from "lucide-react";

export const revalidate = 0;

export default async function AutomationPage({ params }: { params: { guildId: string } }) {
  const access = await authorizeGuild(params.guildId, "manage");
  if (!access.ok) redirect("/dashboard");

  const guild = await prisma.guild.findUnique({
    where: { id: params.guildId },
    select: {
      id: true,
      name: true,
      announcement: true,
      autoArchiveDays: true,
      robloxRequiredAssetId: true,
      interviewVoice: true,
      positions: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          isOpen: true,
          opensAt: true,
          closesAt: true,
          maxApplications: true,
          waitlistEnabled: true,
          _count: { select: { applications: true } },
        },
      },
    },
  });
  if (!guild) notFound();

  const initial = {
    guildId: guild.id,
    announcement: guild.announcement ?? "",
    autoArchiveDays: guild.autoArchiveDays,
    robloxRequiredAssetId: guild.robloxRequiredAssetId ?? "",
    interviewVoice: guild.interviewVoice,
    positions: guild.positions.map((p) => ({
      id: p.id,
      title: p.title,
      isOpen: p.isOpen,
      opensAt: p.opensAt ? p.opensAt.toISOString() : null,
      closesAt: p.closesAt ? p.closesAt.toISOString() : null,
      maxApplications: p.maxApplications,
      waitlistEnabled: p.waitlistEnabled,
      applicationCount: p._count.applications,
    })),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
      </Link>
      <p className="eyebrow mb-2 mt-6">{guild.name}</p>
      <h1 className="display-md">Scheduling &amp; automation</h1>
      <p className="mt-2 text-[14px] text-muted">
        Schedule openings, cap applications, post a notice, and set how long decided applications stay on the board.
      </p>
      <AutomationForm initial={initial} />
    </div>
  );
}
