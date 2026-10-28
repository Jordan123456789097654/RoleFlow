import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import { Clock, Briefcase, FileText, ArrowRight, MessageSquare, AlertCircle } from "lucide-react";

export const revalidate = 0;

export default async function MyApplicationsPage() {
  const user = await getCurrentUser();

  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    include: {
      position: {
        include: { guild: true },
      },
      answers: {
        include: { question: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          My Applications
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Track the status of all your submitted community and studio applications in one place.
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-20 border border-white/5 rounded-3xl bg-surface/30 glass-panel">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Applications Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
            You haven&apos;t submitted any applications. Browse active openings across verified communities to apply!
          </p>
          <Link
            href="/browse"
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 transition-all inline-flex items-center gap-2"
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
              className="glass-panel glass-panel-hover rounded-2xl p-6 border border-white/5 hover:border-purple-500/30 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-card border border-white/10 overflow-hidden shrink-0">
                    {app.position.guild.icon ? (
                      <img
                        src={app.position.guild.icon}
                        alt={app.position.guild.name}
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
                      <span className="text-xs font-medium text-slate-400">
                        {app.position.guild.name}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">
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
                <div className="mb-4 p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 text-xs flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span>
                    <strong>Interview Stage:</strong> Staff have shortlisted your application! Look out for your interview thread in Discord.
                  </span>
                </div>
              )}

              {app.decisionNote && (
                <div className="mb-4 p-3.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs">
                  <span className="text-[10px] uppercase font-bold text-purple-400 block mb-1">
                    Staff Feedback Note:
                  </span>
                  <p className="leading-relaxed">{app.decisionNote}</p>
                </div>
              )}

              {/* Submitted Details & Answers preview */}
              <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Submitted on {formatDate(app.createdAt)}
                </span>

                <div className="flex items-center gap-3">
                  <span className="text-slate-400">
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
