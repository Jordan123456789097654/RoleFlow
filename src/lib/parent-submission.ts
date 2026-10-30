export type SubmissionKind = "contact" | "idea" | "notify" | "newsletter";

export interface SubmissionInput {
  kind: string;
  email: string;
  name?: string;
  message?: string;
  interest?: string;
  honeypot?: string;
}

export interface ValidationResult {
  ok: boolean;
  error?: string;
  data?: {
    kind: SubmissionKind;
    email: string;
    name?: string;
    message?: string;
    interest?: string;
  };
}

const ALLOWED_KINDS = new Set<SubmissionKind>(["contact", "idea", "notify", "newsletter"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateParentSubmission(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Invalid submission payload." };
  }

  const input = raw as Record<string, unknown>;

  // Honeypot check (bots fill hidden field)
  if (input.honeypot && String(input.honeypot).trim().length > 0) {
    return { ok: false, error: "Spam detected." };
  }

  const kindStr = String(input.kind || "").trim().toLowerCase();
  if (!ALLOWED_KINDS.has(kindStr as SubmissionKind)) {
    return { ok: false, error: "Invalid submission kind." };
  }
  const kind = kindStr as SubmissionKind;

  const email = String(input.email || "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false, error: "Please provide a valid email address." };
  }

  const name = typeof input.name === "string" ? input.name.trim().slice(0, 100) : undefined;
  const interest = typeof input.interest === "string" ? input.interest.trim().slice(0, 100) : undefined;
  const message = typeof input.message === "string" ? input.message.trim().slice(0, 5000) : undefined;

  // Contact and idea submissions require a message
  if ((kind === "contact" || kind === "idea") && (!message || message.length < 5)) {
    return { ok: false, error: "Please include a message with at least 5 characters." };
  }

  return {
    ok: true,
    data: {
      kind,
      email,
      name: name || undefined,
      interest: interest || undefined,
      message: message || undefined,
    },
  };
}
