import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SURVEY_ID_PATTERN, surveyStatus } from "@/lib/departure-survey";
import { LeavingSurveyForm } from "@/components/parent/LeavingSurveyForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Why are you leaving? | RoleFlow",
  robots: { index: false, follow: false },
};

export default async function LeavingPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const survey = SURVEY_ID_PATTERN.test(id)
    ? await prisma.departureSurvey.findUnique({ where: { id } }).catch(() => null)
    : null;
  const status = surveyStatus(survey);

  if (status !== "open") {
    const message =
      status === "answered"
        ? "You already answered this survey. Thank you for telling us."
        : status === "expired"
          ? "This link has expired. Thank you for the time you spent with RoleFlow."
          : "This link is not valid.";
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center sm:px-8">
        <h1 className="text-2xl font-extrabold text-white">{message}</h1>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-violet-400 hover:text-violet-300">
          Back to RoleFlow
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-16 sm:px-8">
      <span className="font-mono text-xs uppercase tracking-widest text-violet-400">Before you go</span>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Why are you leaving?</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">
        Your answer helps us decide what to fix and what to build. It is not linked to your deleted account, and you only need to answer once.
      </p>
      <div className="mt-8">
        <LeavingSurveyForm surveyId={id} />
      </div>
    </div>
  );
}
