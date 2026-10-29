import React from "react";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";
import { WorkspaceShell } from "@/components/dashboard/WorkspaceShell";

export const revalidate = 0;

/** Shared workspace frame (sidebar and top bar) for every page under a community's dashboard. */
export default async function GuildLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { guildId: string };
}) {
  const access = await authorizeGuild(params.guildId, "view");
  if (!access.ok) redirect("/dashboard");

  const guild = await prisma.guild.findUnique({
    where: { id: params.guildId },
    select: { id: true, name: true, icon: true },
  });
  if (!guild) notFound();

  const canManage = (await authorizeGuild(params.guildId, "manage")).ok;

  return (
    <WorkspaceShell guildId={guild.id} guildName={guild.name} guildIcon={guild.icon} canManage={canManage}>
      {children}
    </WorkspaceShell>
  );
}
