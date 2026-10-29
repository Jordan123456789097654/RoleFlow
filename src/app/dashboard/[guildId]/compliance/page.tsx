import React from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authorizeGuild } from "@/lib/guild-access";
import { strikeRecommendation, strikeWindowStart } from "@/lib/compliance";
import { AnnouncementForm, InfractionForm, ManualLogRequestForm, ManualLogDecision } from "@/components/dashboard/ComplianceForms";
import { AnnouncementGate } from "@/components/dashboard/AnnouncementGate";

import { ArrowLeft } from "lucide-react";
export const revalidate = 0;

export default async function CompliancePage({ params }: { params: { guildId: string } }) {
  const access = await authorizeGuild(params.guildId, "view");
  if (!access.ok) redirect("/dashboard");
  const canManage = (await authorizeGuild(params.guildId, "manage")).ok;

  const guild = await prisma.guild.findUnique({ where: { id: params.guildId }, select: { id: true, name: true } });
  if (!guild) notFound();

  const staff = await prisma.guildStaff.findMany({
    where: { guildId: params.guildId },
    select: { userId: true, username: true },
    orderBy: { createdAt: "asc" },
  });
  const members = staff.map((s) => ({ userId: s.userId, username: s.username ?? "Unknown staff" }));

  let announcements: any[] = [];
  let pendingLogs: any[] = [];
  let standing: { name: string; points: number; recommendation: string }[] = [];
  if (canManage) {
    const now = new Date();
    const [a, logs, recent] = await Promise.all([
      prisma.announcement.findMany({
        where: { guildId: params.guildId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, title: true, hardGate: true, createdAt: true, _count: { select: { acks: true } } },
      }),
      prisma.manualLogRequest.findMany({
        where: { guildId: params.guildId, status: "PENDING" },
        orderBy: { createdAt: "asc" },
        select: { id: true, staffUserId: true, shiftType: true, description: true, workedAt: true, minutes: true },
      }),
      prisma.staffInfraction.findMany({
        where: { guildId: params.guildId, createdAt: { gte: strikeWindowStart(now) } },
        select: { staffUserId: true, points: true },
      }),
    ]);
    announcements = a;
    pendingLogs = logs;
    const totals = new Map<string, number>();
    for (const r of recent) totals.set(r.staffUserId, (totals.get(r.staffUserId) ?? 0) + r.points);
    standing = members
      .map((m) => {
        const points = totals.get(m.userId) ?? 0;
        return { name: m.username, points, recommendation: strikeRecommendation(points) };
      })
      .filter((s) => s.points > 0)
      .sort((x, y) => y.points - x.points);
  }

  const nameOf = (id: string) => members.find((m) => m.userId === id)?.username ?? "Unknown staff";

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-10 sm:px-6">
      <Link href={`/dashboard/${guild.id}/staff`} className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to staff roster
      </Link>
      <AnnouncementGate guildId={guild.id} />
      <p className="eyebrow mb-2 mt-6">{guild.name}</p>
      <h1 className="display-md">Compliance</h1>
      <p className="mt-2 text-[14px] text-muted">Announcements, manual time requests, and conduct records.</p>

      <section className="mt-10">
        <h2 className="text-[16px] font-semibold text-ink">Request manual time</h2>
        <p className="mt-1 mb-4 text-[13px] text-muted">For work done outside the game. Managers review each request.</p>
        <ManualLogRequestForm guildId={guild.id} />
      </section>

      {canManage && (
        <>
          <section className="mt-12">
            <h2 className="text-[16px] font-semibold text-ink">Pending manual time</h2>
            <div className="mt-4 space-y-3">
              {pendingLogs.length === 0 && <p className="text-[13px] text-muted">Nothing waiting.</p>}
              {pendingLogs.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4">
                  <div className="text-[13px] text-muted">
                    <p className="text-ink">{nameOf(r.staffUserId)} · {r.minutes} min · {r.shiftType}</p>
                    <p>{r.description}</p>
                    <p className="text-[12px]">{new Date(r.workedAt).toLocaleString()}</p>
                  </div>
                  <ManualLogDecision guildId={guild.id} reqId={r.id} />
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-[16px] font-semibold text-ink">Announcements</h2>
            <div className="mt-4"><AnnouncementForm guildId={guild.id} /></div>
            <div className="mt-6 space-y-2">
              {announcements.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-[13px] text-muted">
                  <span className="text-ink">{a.title}{a.hardGate ? " · hard gate" : ""}</span>
                  <span>{a._count.acks} acknowledged · {new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-[16px] font-semibold text-ink">Log an infraction</h2>
            <p className="mt-1 mb-4 text-[13px] text-muted">Strike points count for 90 days. Recommendations are advisory only.</p>
            {members.length > 0 ? <InfractionForm guildId={guild.id} members={members} /> : <p className="text-[13px] text-muted">No staff yet.</p>}
            <div className="mt-6 space-y-2">
              {standing.length === 0 && <p className="text-[13px] text-muted">No active strikes.</p>}
              {standing.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-[13px] text-muted">
                  <span className="text-ink">{s.name}</span>
                  <span>{s.points} points · {s.recommendation === "NONE" ? "no action" : s.recommendation === "WARNING" ? "warning recommended" : "demotion review recommended"}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
