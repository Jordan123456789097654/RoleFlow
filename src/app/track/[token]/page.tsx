import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";

export const revalidate = 0;
export const metadata: Metadata = { title: "Application status | RoleFlow", robots: { index: false, follow: false } };

export default async function TrackPage({ params }: { params: { token: string } }) {
  if (!/^[a-f0-9]{32}$/.test(params.token)) notFound();

  // Deliberately exposes only status information. No applicant name, answers or staff notes.
  const app = await prisma.application.findUnique({
    where: { trackingToken: params.token },
    select: {
      status: true,
      waitlisted: true,
      createdAt: true,
      updatedAt: true,
      position: { select: { title: true, guild: { select: { name: true } } } },
    },
  });
  if (!app) notFound();

  return (
    <div className="mx-auto max-w-xl px-4 pb-16 pt-16">
      <p className="eyebrow mb-2">Application status</p>
      <h1 className="display-md">{app.position.title}</h1>
      <p className="mt-1 text-[14px] text-muted">{app.position.guild.name}</p>

      <div className="card mt-8 space-y-4 p-6">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[13px] text-muted">Current status</span>
          <StatusBadge status={app.status} size="md" />
        </div>
        {app.waitlisted && app.status === "PENDING" && (
          <p className="rounded-lg border border-line bg-sunk p-3 text-[13px] text-ink-2">
            This opening was full when the application arrived, so it is on the waitlist.
          </p>
        )}
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-muted">Submitted</span>
          <span className="text-ink-2">{formatDate(app.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-muted">Last updated</span>
          <span className="text-ink-2">{formatDate(app.updatedAt)}</span>
        </div>
      </div>

      <p className="mt-6 text-[12px] text-faint">
        This page shows status only. <Link href="/my-applications" className="underline">Sign in</Link> to see the full application and message staff.
      </p>
    </div>
  );
}
