export type ActivityWindow = 7 | 30 | 90;

export type RawActivityEvents = {
  shifts: Array<{ robloxUserId: string; closedAt: string | Date | null }>;
  trainings: Array<{ robloxUserId: string; completed: boolean; completedAt: string | Date | null }>;
  actions: Array<{ actorUserId?: string | null; targetRobloxUserId: string; createdAt: string | Date }>;
};

export type StaffActivitySummary = {
  robloxUserId: string;
  shiftsCompleted: number;
  trainingsCompleted: number;
  actionsLoggedOrTargeted: number;
  totalScore: number;
};

/**
 * Pure function: Computes simple activity counts per staff member over 7, 30, or 90 days.
 * Strictly adheres to Spec 4.7:
 * - Simple count of completed shifts, training sessions, and actions per staff member over chosen period.
 * - No keystroke, presence, or screen tracking.
 */
export function calculateStaffActivity(
  robloxUserIds: string[],
  events: RawActivityEvents,
  days: ActivityWindow = 30,
  referenceNow: Date = new Date()
): Map<string, StaffActivitySummary> {
  const windowMillis = days * 24 * 60 * 60 * 1000;
  const cutoffTime = referenceNow.getTime() - windowMillis;

  const summaryMap = new Map<string, StaffActivitySummary>();

  for (const id of robloxUserIds) {
    summaryMap.set(id, {
      robloxUserId: id,
      shiftsCompleted: 0,
      trainingsCompleted: 0,
      actionsLoggedOrTargeted: 0,
      totalScore: 0,
    });
  }

  // 1. Completed shifts
  for (const shift of events.shifts) {
    if (!shift.closedAt) continue;
    const time = new Date(shift.closedAt).getTime();
    if (time >= cutoffTime) {
      const summary = summaryMap.get(shift.robloxUserId);
      if (summary) {
        summary.shiftsCompleted += 1;
      }
    }
  }

  // 2. Completed trainings
  for (const training of events.trainings) {
    if (!training.completed || !training.completedAt) continue;
    const time = new Date(training.completedAt).getTime();
    if (time >= cutoffTime) {
      const summary = summaryMap.get(training.robloxUserId);
      if (summary) {
        summary.trainingsCompleted += 1;
      }
    }
  }

  // 3. Actions
  for (const action of events.actions) {
    const time = new Date(action.createdAt).getTime();
    if (time >= cutoffTime) {
      const summary = summaryMap.get(action.targetRobloxUserId);
      if (summary) {
        summary.actionsLoggedOrTargeted += 1;
      }
    }
  }

  // Calculate composite activity score
  for (const summary of summaryMap.values()) {
    summary.totalScore =
      summary.shiftsCompleted * 3 +
      summary.trainingsCompleted * 2 +
      summary.actionsLoggedOrTargeted;
  }

  return summaryMap;
}
