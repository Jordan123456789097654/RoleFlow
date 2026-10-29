export const INFRACTION_CATEGORIES = ["POWER_ABUSE", "HINT_EXPLOITATION", "ACTIVITY_FABRICATION", "OTHER"] as const;
export const SHIFT_LOG_TYPES = ["MANUAL", "TRAINING", "EVENT", "PATROL", "STANDARD"] as const;

export const STRIKE_WINDOW_DAYS = 90;
export const WARNING_POINTS = 3;
export const DEMOTION_REVIEW_POINTS = 6;

/** Recommendations only. Staff are never demoted automatically. */
export function strikeRecommendation(points: number): "NONE" | "WARNING" | "DEMOTION_REVIEW" {
  if (points >= DEMOTION_REVIEW_POINTS) return "DEMOTION_REVIEW";
  if (points >= WARNING_POINTS) return "WARNING";
  return "NONE";
}

export function strikeWindowStart(now: Date): Date {
  return new Date(now.getTime() - STRIKE_WINDOW_DAYS * 86_400_000);
}

/** Evidence must be a plain https link. Nothing else is stored or rendered as a link. */
export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
