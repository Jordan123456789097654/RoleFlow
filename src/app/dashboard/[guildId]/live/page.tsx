import React from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";
import { getLiveServers, getRecentBroadcasts } from "@/lib/live-ops";
import { LiveOpsForm } from "@/components/dashboard/LiveOpsForm";

export const revalidate = 0;

function uptime(since: Date, now: Date) {
  const mins = Math.max(0, Math.floor((now.getTime() - since.getTime()) / 60_000));
  const h = Math.floor(mins / 60);
  return h ? `${h}h ${mins % 60}m` : `${mins}m`;
}

export default async function LivePage({ params }: { params: { guildId: string } }) {
  const access = await authorizeGuild(params.guildId, "view");
  if (!access.ok) redirect("/dashboard");
  const canManage = (await authorizeGuild(params.guildId, "manage")).ok;

  const guild = await prisma.guild.findUnique({ where: { id: params.guildId }, select: { id: true, name: true } });
  if (!guild) notFound();

  const now = new Date();
  const servers = await getLiveServers(guild.id, now);
  const broadcasts = canManage ? await getRecentBroadcasts(guild.id) : [];

  return (
    <div className="max-w-4xl pb-16">
      <p className="eyebrow mb-2">{guild.name}</p>
      <h1 className="display-md">Live servers</h1>
      <p className="mt-2 text-[14px] text-muted">
        Servers that reported in the last 3 minutes. Refresh the page to update.
      </p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left text-[14px]">
          <thead className="text-[12px] uppercase tracking-wide text-muted">
            <tr>
              <th className="py-2 pr-4 font-medium">Players</th>
              <th className="py-2 pr-4 font-medium">Ping</th>
              <th className="py-2 pr-4 font-medium">Uptime</th>
              <th className="py-2 font-medium">Staff on server</th>
            </tr>
          </thead>
          <tbody>
            {servers.map((s) => (
              <tr key={s.serverJobId} className="border-t border-line">
                <td className="py-3 pr-4 text-ink">{s.playerCount}/{s.maxPlayers}</td>
                <td className="py-3 pr-4 text-muted">{s.averagePingMs != null ? `${s.averagePingMs} ms` : "—"}</td>
                <td className="py-3 pr-4 text-muted">{uptime(s.startedAt, now)}</td>
                <td className="py-3 text-muted">{s.staffOnline.length ? s.staffOnline.join(", ") : "None"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {servers.length === 0 && <p className="mt-6 text-[14px] text-muted">No live servers right now.</p>}
      </div>

      {canManage && (
        <section className="mt-12">
          <h2 className="text-[16px] font-semibold text-ink">Broadcast to all live servers</h2>
          <p className="mt-1 mb-4 text-[13px] text-muted">
            Owners only. One broadcast per 10 minutes. Every send is recorded in the audit log.
          </p>
          <LiveOpsForm guildId={guild.id} liveCount={servers.length} />

          <div className="mt-6 space-y-2">
            {broadcasts.length === 0 && <p className="text-[13px] text-muted">No broadcasts yet.</p>}
            {broadcasts.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-4 text-[13px] text-muted">
                <span className="truncate text-ink">{b.message}</span>
                <span className="shrink-0">
                  {b._count.receipts} server(s) · {new Date(b.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
