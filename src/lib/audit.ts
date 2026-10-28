import { prisma } from "./prisma";

/**
 * Records a privileged action. Failures are logged but never break the request.
 */
export async function recordAudit(entry: {
  actorId: string;
  action: string;
  targetId?: string | null;
  details?: unknown;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        targetId: entry.targetId ?? null,
        details: entry.details === undefined ? null : JSON.stringify(entry.details),
      },
    });
  } catch (err) {
    console.error("Audit log write failed:", err);
  }
}
