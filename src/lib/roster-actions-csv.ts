export type ModerationActionCSVRecord = {
  id: string;
  type: string;
  targetRobloxUserId: string;
  actorUsername: string;
  reason: string;
  durationMinutes: number | null;
  createdAt: string;
  editedAt: string | null;
};

/**
 * Escapes a single CSV cell safely following RFC 4180
 */
export function escapeCSVCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  // If the cell contains quotes, commas, or linebreaks, wrap in quotes and double internal quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Exports actions to CSV string
 */
export function exportActionsToCSV(actions: ModerationActionCSVRecord[]): string {
  const headers = [
    "Action ID",
    "Type",
    "Target Roblox User ID",
    "Actor / Moderator",
    "Reason",
    "Duration (Minutes)",
    "Created At (UTC)",
    "Edited At (UTC)",
  ];

  const rows = actions.map((a) => [
    escapeCSVCell(a.id),
    escapeCSVCell(a.type),
    escapeCSVCell(a.targetRobloxUserId),
    escapeCSVCell(a.actorUsername),
    escapeCSVCell(a.reason),
    escapeCSVCell(a.durationMinutes !== null ? a.durationMinutes : ""),
    escapeCSVCell(a.createdAt),
    escapeCSVCell(a.editedAt || ""),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}
