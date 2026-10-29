import React from "react";

const STEPS = [
  { key: "PENDING", label: "Submitted" },
  { key: "UNDER_REVIEW", label: "Under review" },
  { key: "INTERVIEW", label: "Interview" },
  { key: "DECIDED", label: "Decision" },
] as const;

const STAGE: Record<string, number> = {
  PENDING: 0,
  UNDER_REVIEW: 1,
  INTERVIEW: 2,
  ACCEPTED: 3,
  REJECTED: 3,
};

const NEXT: Record<string, string> = {
  PENDING: "Your application is in the queue. A reviewer will pick it up soon.",
  UNDER_REVIEW: "A reviewer is reading your answers. You'll get an email when there's a decision.",
  INTERVIEW: "You've been invited to an interview. Check your messages and Discord for details.",
  ACCEPTED: "Congratulations. Check your email and Discord for next steps.",
  REJECTED: "This application wasn't selected this time. Any cooldown is shown below.",
};

/**
 * Where the application stands now, and what happens next. Shows the current stage only,
 * because stage history isn't stored yet.
 */
export function ApplicationProgress({
  status,
  estimatedResponse,
}: {
  status: string;
  estimatedResponse?: string | null;
}) {
  const reached = STAGE[status] ?? 0;
  const next = NEXT[status];

  return (
    <div className="mb-4 space-y-3">
      <ol className="flex items-center gap-2 text-[11px]">
        {STEPS.map((step, i) => {
          const done = i <= reached;
          const isDecision = step.key === "DECIDED";
          const label = isDecision && status === "ACCEPTED" ? "Accepted"
            : isDecision && status === "REJECTED" ? "Not selected"
            : step.label;
          return (
            <li key={step.key} className="flex flex-1 items-center gap-2">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${done ? "bg-accent" : "bg-line-strong"}`}
                aria-hidden="true"
              />
              <span className={done ? "font-semibold text-ink" : "text-faint"}>{label}</span>
              {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>

      {next && (
        <p className="text-[13px] text-ink-2">
          {next}
          {estimatedResponse && status === "PENDING" && (
            <span className="text-muted"> Usually responds in {estimatedResponse}.</span>
          )}
        </p>
      )}
    </div>
  );
}
