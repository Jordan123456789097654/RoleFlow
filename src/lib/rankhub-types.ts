export interface RankLadderRole {
  id: number;
  name: string;
  rank: number; // 1 to 255 (0 is Guest)
  memberCount: number;
  isCeiling?: boolean;
  isProtected?: boolean;
}

export interface GroupCredentialState {
  groupId: string;
  groupName: string;
  groupIcon?: string;
  memberCount: number;
  authMethod: "open_cloud" | "cookie" | "both" | "none";
  openCloudConfigured: boolean;
  cookieConfigured: boolean;
  openCloudHealthy: boolean;
  cookieHealthy: boolean;
  botUsername?: string;
  botAvatar?: string;
  rankCeiling: number; // maximum rank the bot is permitted to touch, e.g. 250
  protectedRanks: number[]; // e.g. [250, 254, 255]
  lastVerifiedAt?: string;
}

export interface BatchRankItem {
  id: string;
  targetUsername: string;
  robloxUserId: string;
  currentRankName: string;
  currentRank: number;
  newRankName: string;
  newRank: number;
  reason: string;
  source: "manual" | "applyhub" | "csv_import";
  status: "pending" | "simulated" | "success" | "error" | "rolled_back";
  errorDetails?: string;
}

export interface ApplyHubRule {
  id: string;
  formId: string;
  formName: string;
  targetRoleId: number;
  targetRoleName: string;
  targetRank: number;
  autoPromote: boolean;
  discordNotify: boolean;
  active: boolean;
  passedCount: number;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  actorAvatar?: string;
  action: "PROMOTE" | "DEMOTE" | "BATCH_RANK" | "ROLLBACK" | "APPLYHUB_AUTO";
  targetUser: string;
  robloxUserId: string;
  targetAvatar?: string;
  fromRankName: string;
  fromRank: number;
  toRankName: string;
  toRank: number;
  reason: string;
  method: "Open Cloud" | "Cookie Bot";
  batchId?: string;
  canRollback: boolean;
  isRolledBack?: boolean;
}
