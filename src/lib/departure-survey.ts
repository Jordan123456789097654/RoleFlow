import { randomBytes } from "crypto";
import { prisma } from "./prisma";

export const DEPARTURE_REASONS = [
  { value: "not_using", label: "I am not using RoleFlow anymore" },
  { value: "found_alternative", label: "I switched to another tool" },
  { value: "missing_feature", label: "A feature I need is missing" },
  { value: "too_complicated", label: "It was hard to use" },
  { value: "privacy", label: "I am concerned about my data" },
  { value: "other", label: "Something else" },
] as const;

export type DepartureReason = (typeof DEPARTURE_REASONS)[number]["value"];

export const SURVEY_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
export const SURVEY_ID_PATTERN = /^[A-Za-z0-9_-]{32,64}$/;
const MAX_COMMENT = 1000;

export type SurveyValidation =
  | { ok: true; data: { reason: DepartureReason; comment: string | null } }
  | { ok: false; error: string };

/** Pure validation for a survey answer. Used by the API route and tested directly. */
export function validateDepartureAnswer(raw: unknown): SurveyValidation {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Send a reason." };
  const { reason, comment } = raw as { reason?: unknown; comment?: unknown };
  const valid = DEPARTURE_REASONS.find((r) => r.value === reason);
  if (!valid) return { ok: false, error: "Choose one of the reasons." };
  if (comment !== undefined && comment !== null && typeof comment !== "string") {
    return { ok: false, error: "Comment must be text." };
  }
  const trimmed = typeof comment === "string" ? comment.trim() : "";
  if (trimmed.length > MAX_COMMENT) {
    return { ok: false, error: `Keep comments under ${MAX_COMMENT} characters.` };
  }
  return { ok: true, data: { reason: valid.value, comment: trimmed || null } };
}

/** A survey link is usable only before it expires and before it has been answered. */
export function surveyStatus(
  survey: { expiresAt: Date; submittedAt: Date | null } | null,
  now: Date = new Date(),
): "missing" | "expired" | "answered" | "open" {
  if (!survey) return "missing";
  if (survey.submittedAt) return "answered";
  if (survey.expiresAt.getTime() <= now.getTime()) return "expired";
  return "open";
}

/** Creates a fresh survey row and returns its ID for the goodbye email. */
export async function createDepartureSurvey(now: Date = new Date()): Promise<{ id: string; expiresAt: Date }> {
  const id = randomBytes(24).toString("base64url");
  const expiresAt = new Date(now.getTime() + SURVEY_LIFETIME_MS);
  await prisma.departureSurvey.create({ data: { id, expiresAt } });
  return { id, expiresAt };
}
