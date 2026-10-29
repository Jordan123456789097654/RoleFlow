import React from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";
import { buildRoster } from "@/lib/staff-roster";
import { getRobloxGroupRoles } from "@/lib/roblox";
import { GameSecretPanel } from "@/components/dashboard/GameSecretPanel";
import { QuotaEditor } from "@/components/dashboard/QuotaEditor";
import { StaffLinkEditor } from "@/components/dashboard/StaffLinkEditor";
import { AddManualStaffForm } from "@/components/dashboard/AddManualStaffForm";

import { ArrowLeft } from "lucide-react";
export const revalidate = 0;

const TONE_CLASS: Record<string, string> = {
  orange: "bg-orange-500",
  yellow: "bg-yellow-400",
  green: "bg-green-500",
};

function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export default async function StaffRosterPage({ params }: { params: { guildId: string } }) {
  const access = await authorizeGuild(params.guildId, "view");
  if (!access.ok) redirect("/dashboard");
  const canManage = (await authorizeGuild(params.guildId, "manage")).ok;

  const guild = await prisma.guild.findUnique({
    where: { id: params.guildId },
    select: {
      id: true,
      name: true,
      robloxGroupId: true,
      staffMonitoredRanks: true,
      staffGameSecretHash: true,
      staffGameSecretRotatedAt: true,
    },
  });
  if (!guild) notFound();

  const roster = await buildRoster(params.guildId);
  const allRoles = canManage && guild.robloxGroupId ? await getRobloxGroupRoles(guild.robloxGroupId) : [];
  const roles = guild.staffMonitoredRanks.length
    ? allRoles.filter((r) => guild.staffMonitoredRanks.includes(r.rank))
    : allRoles;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-10 sm:px-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
      </Link>
      <p className="eyebrow mb-2 mt-6">{guild.name}</p>
      <h1 className="display-md">Staff roster</h1>
      <p className="mt-2 text-[14px] text-muted">
        Weekly quota progress for each staff member, based on their Roblox rank. Weeks run Monday to Sunday in UTC.
      </p>
      <Link href={`/dashboard/${guild.id}/compliance`} className="mt-3 inline-block text-[13px] text-accent hover:text-accent-hover">
        Announcements, manual time, and conduct →
      </Link>
      <Link href={`/dashboard/${guild.id}/live`} className="mt-3 ml-4 inline-block text-[13px] text-accent hover:text-accent-hover">
        Live servers →
      </Link>

      {canManage && (
        <GameSecretPanel
          guildId={guild.id}
          configured={Boolean(guild.staffGameSecretHash)}
          rotatedAt={guild.staffGameSecretRotatedAt?.toISOString() ?? null}
          canManage={canManage}
        />
      )}

      {!roster.linked && roster.members.length === 0 && (
        <p className="mt-8 text-[14px] text-muted">Link a Roblox group in Settings to start tracking staff quotas.</p>
      )}

      {(roster.linked || roster.members.length > 0) && (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="text-[12px] uppercase tracking-wide text-muted">
              <tr>
                <th className="py-2 pr-4 font-medium">Staff</th>
                <th className="py-2 pr-4 font-medium">Rank</th>
                <th className="py-2 pr-4 font-medium">This week</th>
                <th className="py-2 font-medium">Quota</th>
              </tr>
            </thead>
            <tbody>
              {roster.members.map((m) => (
                <tr key={m.userId} className="border-t border-line">
                  <td className="py-3 pr-4 text-ink">
                    {m.username}
                    {!m.robloxUserId && <span className="ml-2 text-[12px] text-muted">Roblox not linked</span>}
                  </td>
                  <td className="py-3 pr-4 text-muted">{m.rankName ?? "No quota"}</td>
                  <td className="py-3 pr-4 text-muted">{formatHours(m.minutes)}</td>
                  <td className="py-3">
                    {m.percent == null ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-40 overflow-hidden rounded-full bg-sunk">
                          <div className={`h-full ${TONE_CLASS[m.tone!]}`} style={{ width: `${m.percent}%` }} />
                        </div>
                        <span className="text-[12px] text-muted">
                          {m.percent}% of {formatHours(m.quotaMinutes!)}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {roster.members.length === 0 && <p className="mt-6 text-[14px] text-muted">No staff yet.</p>}
        </div>
      )}

      {canManage && (
        <>
          <section className="mt-12">
            <h2 className="text-[16px] font-semibold text-ink">Add staff by hand</h2>
            <p className="mt-1 mb-4 text-[13px] text-muted">For communities without a Roblox group. A Roblox account is required for every staff member.</p>
            <AddManualStaffForm guildId={guild.id} roles={roles} />
          </section>
          <QuotaEditor guildId={guild.id} initialRules={roster.rules} roles={roles} />
          <StaffLinkEditor guildId={guild.id} members={roster.members} roles={roles} />
        </>
      )}
    </div>
  );
}
