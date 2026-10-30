export const POLL_LIMITS = { question: 200, description: 1000, option: 120, maxOptions: 12, minOptions: 2, otherLabel: 60, otherText: 300 };

export type PollInput = {
  question: string;
  description: string | null;
  options: string[];
  allowOther: boolean;
  otherLabel: string;
  closesAt: Date | null;
};

/** Checks a poll from the founder console. Returns clean values or the first problem found. */
export function validatePollInput(body: any): { ok: true; value: PollInput } | { ok: false; error: string } {
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question) return { ok: false, error: "Write the question." };
  if (question.length > POLL_LIMITS.question) return { ok: false, error: `The question must be ${POLL_LIMITS.question} characters or fewer.` };

  const description = typeof body?.description === "string" ? body.description.trim() : "";
  if (description.length > POLL_LIMITS.description) return { ok: false, error: `The description must be ${POLL_LIMITS.description} characters or fewer.` };

  const rawOptions: unknown[] = Array.isArray(body?.options) ? body.options : [];
  const options: string[] = [];
  for (const o of rawOptions) {
    const t = typeof o === "string" ? o.trim() : "";
    if (!t) continue;
    if (t.length > POLL_LIMITS.option) return { ok: false, error: `Each option must be ${POLL_LIMITS.option} characters or fewer.` };
    if (options.some((x) => x.toLowerCase() === t.toLowerCase())) return { ok: false, error: `The option "${t}" is listed twice.` };
    options.push(t);
  }
  if (options.length < POLL_LIMITS.minOptions) return { ok: false, error: `Add at least ${POLL_LIMITS.minOptions} options.` };
  if (options.length > POLL_LIMITS.maxOptions) return { ok: false, error: `Use at most ${POLL_LIMITS.maxOptions} options.` };

  const allowOther = body?.allowOther === true;
  const otherLabel = (typeof body?.otherLabel === "string" ? body.otherLabel.trim() : "") || "Something else";
  if (otherLabel.length > POLL_LIMITS.otherLabel) return { ok: false, error: `The "other" label must be ${POLL_LIMITS.otherLabel} characters or fewer.` };

  let closesAt: Date | null = null;
  if (body?.closesAt) {
    const d = new Date(body.closesAt);
    if (Number.isNaN(d.getTime())) return { ok: false, error: "The closing date is not valid." };
    if (d.getTime() <= Date.now()) return { ok: false, error: "The closing date must be in the future." };
    closesAt = d;
  }

  return { ok: true, value: { question, description: description || null, options, allowOther, otherLabel, closesAt } };
}

/** A poll is open when its status is OPEN and its closing time (if any) has not passed. */
export function isPollOpen(poll: { status: string; closesAt: Date | null }): boolean {
  return poll.status === "OPEN" && (!poll.closesAt || poll.closesAt.getTime() > Date.now());
}
