/**
 * Pure functions defining Roster roles, permissions, and capabilities.
 * Strictly verified on the server for all mutations and reads.
 */

export type RosterRole = "OWNER" | "MANAGER" | "MODERATOR" | "STAFF";

export interface RosterUserContext {
  userId?: string | null;
  robloxUserId?: string | null;
  role?: RosterRole | null;
  isOwner?: boolean;
}

export type RosterActionType =
  | "group.archive"
  | "group.delete"
  | "group.edit_settings"
  | "group.sync_roblox"
  | "roster.view_full"
  | "roster.edit"
  | "roster.import_application"
  | "staff.view_record"
  | "staff.edit_record"
  | "action.log"
  | "action.view_all"
  | "action.edit_own"
  | "action.export_csv"
  | "training.manage"
  | "shift.manage"
  | "notice.broadcast";

/**
 * Evaluates whether a role has permission to execute an action in a group.
 */
export function hasRosterPermission(
  role: RosterRole | string | null | undefined,
  action: RosterActionType,
  options?: {
    isTargetSelf?: boolean;
    createdMinutesAgo?: number;
    actorUserId?: string | null;
    authorUserId?: string | null;
  }
): boolean {
  if (!role) return false;
  const normalized = role.toUpperCase() as RosterRole;

  switch (action) {
    // 1. Group level ownership
    case "group.delete":
    case "group.archive":
      return normalized === "OWNER";

    case "group.edit_settings":
    case "group.sync_roblox":
      return normalized === "OWNER" || normalized === "MANAGER";

    // 2. Roster directory
    case "roster.view_full":
      // Owner, Manager, Moderator can view the full roster
      return normalized === "OWNER" || normalized === "MANAGER" || normalized === "MODERATOR";

    case "roster.edit":
    case "roster.import_application":
      return normalized === "OWNER" || normalized === "MANAGER";

    // 3. Staff records & dossiers
    case "staff.view_record":
      if (normalized === "OWNER" || normalized === "MANAGER" || normalized === "MODERATOR") {
        return true;
      }
      // Staff can view their own record only
      return normalized === "STAFF" && Boolean(options?.isTargetSelf);

    case "staff.edit_record":
      return normalized === "OWNER" || normalized === "MANAGER";

    // 4. Moderation & actions
    case "action.log":
      return normalized === "OWNER" || normalized === "MANAGER" || normalized === "MODERATOR";

    case "action.view_all":
    case "action.export_csv":
      return normalized === "OWNER" || normalized === "MANAGER";

    case "action.edit_own": {
      // Must be the author AND within 24 hours (1440 minutes)
      if (normalized === "STAFF") return false;
      const isAuthor = options?.actorUserId && options?.authorUserId && options.actorUserId === options.authorUserId;
      const withinWindow = typeof options?.createdMinutesAgo === "number" ? options.createdMinutesAgo <= 1440 : false;
      return Boolean(isAuthor && withinWindow);
    }

    // 5. Operations: training, shifts, notices
    case "training.manage":
    case "shift.manage":
    case "notice.broadcast":
      return normalized === "OWNER" || normalized === "MANAGER";

    default:
      return false;
  }
}

/**
 * Returns a list of all action capabilities for a given role.
 */
export function getAllowedActionsForRole(role: RosterRole | string | null | undefined): RosterActionType[] {
  const actions: RosterActionType[] = [
    "group.archive",
    "group.delete",
    "group.edit_settings",
    "group.sync_roblox",
    "roster.view_full",
    "roster.edit",
    "roster.import_application",
    "staff.view_record",
    "staff.edit_record",
    "action.log",
    "action.view_all",
    "action.edit_own",
    "action.export_csv",
    "training.manage",
    "shift.manage",
    "notice.broadcast",
  ];

  return actions.filter((act) => hasRosterPermission(role, act, { isTargetSelf: true, createdMinutesAgo: 10, actorUserId: "u1", authorUserId: "u1" }));
}
