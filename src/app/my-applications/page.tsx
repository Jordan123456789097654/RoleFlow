import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import { Clock, Briefcase, FileText, ArrowRight, MessageSquare, AlertCircle } from "lucide-react";
import { ApplicantChatThread } from "@/components/ApplicantChatThread";

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
          className="rf-btn-primary"
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">
      <header className="mb-10 max-w-2xl">
        <p className="rf-eyebrow mb-2">Your activity</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-ink">My applications</h1>
        <p className="text-sm sm:text-base text-muted mt-3 leading-relaxed">
          Track the status of all your submitted community and studio applications in one place.
        </p>
      </header>

      {applications.length === 0 ? (
        <div className="rf-card text-center py-20">
          <FileText className="w-12 h-12 text-faint mx-auto mb-3" />
          <h3 className="text-base font-bold text-ink mb-1">No Applications Yet</h3>
          <p className="text-xs text-muted max-w-sm mx-auto mb-6">
            You haven&apos;t submitted any applications. Browse active openings across verified communities to apply!
          </p>
          <Link
            href="/browse"
            className="rf-btn-primary"
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
                  <div className="w-11 h-11 rounded-xl bg-surface-card border border-line overflow-hidden shrink-0">
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
                  <span className="rf-eyebrow block mb-1">
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

              {/* Submitted Details & Answers preview */}
              <div className="pt-4 mt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between text-[12px] text-faint gap-2">
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
    </div>
  );
}
