import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import { Clock, Briefcase, FileText, ArrowRight, MessageSquare, AlertCircle } from "lucide-react";
import { ApplicantChatThread } from "@/components/ApplicantChatThread";
import { WithdrawButton } from "@/components/WithdrawButton";
import { TrackLinkButton } from "@/components/TrackLinkButton";
import { SaveOpeningButton } from "@/components/SaveOpeningButton";

export const revalidate = 0;

export default async function MyApplicationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-28 text-center">
        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-400/20 grid place-items-center text-accent mx-auto mb-5">
          <FileText className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-ink mb-2">Sign in to track applications</h1>
        <p className="text-sm text-muted mb-7 leading-relaxed">
          Please log in with your Discord account via OAuth2 to view and track your submitted applications.
        </p>
        <a
          href="/api/auth/login"
          className="btn-primary"
        >
          <span>Log in with Discord</span>
        </a>
      </div>
    );
  }

  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    include: {
      position: {
        include: { guild: true },
      },
      answers: {
        include: { question: true },
      },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const savedRows = await prisma.savedPosition.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const appliedPositionIds = new Set(applications.map((a) => a.positionId));
  const savedPositions = savedRows.length
    ? (
        await prisma.position.findMany({
          where: { id: { in: savedRows.map((r) => r.positionId) }, isOpen: true },
          include: { guild: true },
        })
      ).filter((p) => !appliedPositionIds.has(p.id))
    : [];

  const DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const stats = {
    total: applications.length,
    inReview: applications.filter((a) => a.status === "PENDING" || a.status === "UNDER_REVIEW").length,
    interviews: applications.filter((a) => a.status === "INTERVIEW").length,
    accepted: applications.filter((a) => a.status === "ACCEPTED").length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">
      <header className="mb-10 max-w-2xl">
        <p className="eyebrow mb-2">Your activity</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-ink">My applications</h1>
        <p className="text-sm sm:text-base text-muted mt-3 leading-relaxed">
          Track the status of all your submitted community and studio applications in one place.
        </p>
      </header>

      {applications.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total submitted", value: stats.total },
            { label: "In review", value: stats.inReview },
            { label: "Interviews", value: stats.interviews },
            { label: "Accepted", value: stats.accepted },
          ].map((s) => (
            <div key={s.label} className="card px-4 py-3">
              <p className="text-[12px] text-muted">{s.label}</p>
              <p className="mt-1 font-display text-[26px] leading-none text-ink tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="card text-center py-20">
          <FileText className="w-12 h-12 text-faint mx-auto mb-3" />
          <h3 className="text-base font-bold text-ink mb-1">No Applications Yet</h3>
          <p className="text-xs text-muted max-w-sm mx-auto mb-6">
            You haven&apos;t submitted any applications. Browse active openings across verified communities to apply!
          </p>
          <Link
            href="/browse"
            className="btn-primary"
          >
            <span>Browse Openings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="glass-panel rounded-2xl p-5 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-surface border border-line overflow-hidden shrink-0">
                    {app.position.guild.icon ? (
                      <img
                        src={app.position.guild.icon}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-violet-600 flex items-center justify-center font-bold text-sm text-white">
                        {app.position.guild.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-muted">
                        {app.position.guild.name}
                      </span>
                    </div>
                    <h3 className="text-[17px] font-semibold text-ink">
                      {app.position.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={app.status} size="md" />
                </div>
              </div>

              {/* Status Specific Alerts */}
              {app.status === "INTERVIEW" && (
                <div className="mb-4 p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-200 text-[13px] flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 shrink-0 text-cyan-700 dark:text-cyan-400" />
                  <span>
                    <strong>Interview Stage:</strong> Staff have shortlisted your application! Look out for your interview thread in Discord.
                  </span>
                </div>
              )}

              {app.decisionNote && (
                <div className="mb-4 p-3.5 rounded-xl bg-sunk border border-line text-ink-2 text-[13px]">
                  <span className="eyebrow block mb-1">
                    Staff Feedback Note:
                  </span>
                  <p className="leading-relaxed">{app.decisionNote}</p>
                </div>
              )}

              {/* Clarification Messaging Thread */}
              <ApplicantChatThread
                applicationId={app.id}
                initialMessages={app.messages}
              />

              {/* Actions: withdraw / reapply */}
              {app.waitlisted && app.status === "PENDING" && (
                <div className="mb-4 rounded-xl border border-line bg-sunk p-3.5 text-[13px] text-ink-2">
                  <strong>Waitlisted:</strong> this opening was full when you applied. Staff can still review your application and move it forward.
                </div>
              )}
              <div className="mb-4 flex flex-wrap items-start justify-end gap-2">
                <TrackLinkButton applicationId={app.id} initialToken={app.trackingToken} />
                {(app.status === "PENDING" || app.status === "UNDER_REVIEW") && (
                  <WithdrawButton applicationId={app.id} label={`${app.position.title} at ${app.position.guild.name}`} />
                )}
              </div>
              {app.status === "REJECTED" && app.position.isOpen && (() => {
                const cooldownMs = (app.position.guild.cooldownDays || 0) * DAY;
                const msLeft = cooldownMs - (now - new Date(app.updatedAt).getTime());
                const daysLeft = Math.ceil(msLeft / DAY);
                return (
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-sunk p-3.5 text-[13px] text-ink-2">
                    <span>
                      {msLeft > 0
                        ? `You can reapply in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`
                        : "The cooldown has passed. You can apply for this opening again."}
                    </span>
                    {msLeft <= 0 && (
                      <Link href={`/apply/${app.positionId}`} className="btn-accent btn-sm">
                        Reapply <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                );
              })()}

              {/* Submitted Details & Answers preview */}
              <div className="pt-4 mt-2 border-t border-line flex flex-wrap items-center justify-between text-[12px] text-faint gap-2">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Submitted on {formatDate(app.createdAt)}
                </span>

                <div className="flex items-center gap-3">
                  <span className="text-muted">
                    {app.answers.length} questions answered
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {savedPositions.length > 0 && (
        <section className="mt-14">
          <p className="eyebrow mb-2">Saved for later</p>
          <h2 className="display-md mb-5">Saved openings</h2>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {savedPositions.map((p) => (
              <li key={p.id} className="card flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate text-[12px] text-muted">{p.guild.name}</p>
                  <p className="truncate text-[15px] font-semibold text-ink">{p.title}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <SaveOpeningButton positionId={p.id} initialSaved signedIn />
                  <Link href={`/apply/${p.id}`} className="btn-accent btn-sm">Apply</Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
