export type RosterFilterOptions = {
  search?: string;
  rank?: string;
  teamId?: string;
  status?: string; // "ALL" | "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "SUSPENDED"
  sortBy?: "name" | "rank" | "lastActivity" | "joinedAt";
  sortOrder?: "asc" | "desc";
};

export type StaffDirectoryItem = {
  robloxUserId: string;
  username: string;
  avatarUrl: string;
  rank: string;
  rankId: number;
  role: string; // OWNER, MANAGER, MODERATOR, STAFF
  status: string; // ACTIVE, INACTIVE, ON_LEAVE, SUSPENDED
  teams: Array<{ id: string; name: string }>;
  joinedAt: string; // ISO date string
  lastActivity: string | null; // ISO date string or null
  shiftsCount: number;
  trainingsCount: number;
  actionsCount: number;
};

/**
 * Filter, sort and paginate staff records purely on the server or in-memory
 */
export function filterAndSortRoster(
  items: StaffDirectoryItem[],
  options: RosterFilterOptions
): StaffDirectoryItem[] {
  let filtered = [...items];

  // 1. Search filter (username or robloxUserId)
  if (options.search && options.search.trim()) {
    const q = options.search.trim().toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.username.toLowerCase().includes(q) ||
        item.robloxUserId.toLowerCase().includes(q)
    );
  }

  // 2. Rank filter
  if (options.rank && options.rank !== "ALL") {
    filtered = filtered.filter((item) => item.rank === options.rank);
  }

  // 3. Team filter
  if (options.teamId && options.teamId !== "ALL") {
    filtered = filtered.filter((item) =>
      item.teams.some((team) => team.id === options.teamId)
    );
  }

  // 4. Status filter
  if (options.status && options.status !== "ALL") {
    filtered = filtered.filter((item) => item.status === options.status);
  }

  // 5. Sorting
  const sortBy = options.sortBy || "rank";
  const order = options.sortOrder || "desc";
  const direction = order === "asc" ? 1 : -1;

  filtered.sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.username.localeCompare(b.username) * direction;
      case "rank":
        // Sort primarily by numeric rank descending
        if (a.rankId !== b.rankId) {
          return (a.rankId - b.rankId) * direction;
        }
        return a.username.localeCompare(b.username);
      case "joinedAt":
        return (new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()) * direction;
      case "lastActivity": {
        const timeA = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
        const timeB = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
        return (timeA - timeB) * direction;
      }
      default:
        return 0;
    }
  });

  return filtered;
}
