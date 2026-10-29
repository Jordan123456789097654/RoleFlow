/** Prisma `where` fragment: positions that are open right now (respects the schedule). */
export function openNowWhere(now: Date = new Date()) {
  return {
    isOpen: true,
    AND: [
      { OR: [{ opensAt: null }, { opensAt: { lte: now } }] },
      { OR: [{ closesAt: null }, { closesAt: { gt: now } }] },
    ],
  };
}

const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function availabilityOf(
  p: { isOpen: boolean; opensAt?: Date | null; closesAt?: Date | null },
  now: Date = new Date()
): { open: true } | { open: false; message: string } {
  if (!p.isOpen) return { open: false, message: "This position is currently closed to new applications." };
  if (p.opensAt && p.opensAt > now) return { open: false, message: `This opening starts accepting applications on ${fmt(p.opensAt)}.` };
  if (p.closesAt && p.closesAt <= now) return { open: false, message: `Applications for this opening closed on ${fmt(p.closesAt)}.` };
  return { open: true };
}
