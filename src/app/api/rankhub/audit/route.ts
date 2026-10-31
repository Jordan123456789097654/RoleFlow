import { NextResponse } from "next/server";
import type { AuditLogItem } from "@/lib/rankhub-types";

let MOCK_AUDIT: AuditLogItem[] = [
  {
    id: "aud_101",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    actor: "JordanD (Site Admin)",
    actorAvatar: "https://cdn.discordapp.com/embed/avatars/0.png",
    action: "BATCH_RANK",
    targetUser: "PixelDev_99",
    robloxUserId: "10984124",
    fromRankName: "Guest",
    fromRank: 1,
    toRankName: "Junior Moderator",
    toRank: 40,
    reason: "Passed application quorum (ApplyHub Form #291)",
    method: "Open Cloud",
    batchId: "batch_sim_8921",
    canRollback: true,
  },
  {
    id: "aud_102",
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    actor: "RoleFlow Automation",
    action: "APPLYHUB_AUTO",
    targetUser: "CoffeeMaker_Sam",
    robloxUserId: "8821941",
    fromRankName: "Customer",
    fromRank: 2,
    toRankName: "Trainee",
    toRank: 10,
    reason: "Instant auto-promotion trigger after passing Quiz & Application",
    method: "Cookie Bot",
    canRollback: true,
  },
  {
    id: "aud_103",
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    actor: "Avery_Lead",
    actorAvatar: "https://cdn.discordapp.com/embed/avatars/1.png",
    action: "PROMOTE",
    targetUser: "VortexScripter",
    robloxUserId: "44910214",
    fromRankName: "Junior Developer",
    fromRank: 60,
    toRankName: "Senior Developer",
    toRank: 120,
    reason: "Promotion following Q3 Milestone delivery",
    method: "Open Cloud",
    canRollback: true,
  },
  {
    id: "aud_104",
    timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    actor: "JordanD (Site Admin)",
    actorAvatar: "https://cdn.discordapp.com/embed/avatars/0.png",
    action: "DEMOTE",
    targetUser: "InactivityWarningUser",
    robloxUserId: "7718293",
    fromRankName: "Senior Moderator",
    fromRank: 50,
    toRankName: "Member",
    toRank: 5,
    reason: "Inactivity demotion logged by Roster activity tracker",
    method: "Cookie Bot",
    canRollback: false,
    isRolledBack: false,
  },
];

export async function GET() {
  return NextResponse.json({ logs: MOCK_AUDIT });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, logId } = body;

    if (action === "rollback") {
      const target = MOCK_AUDIT.find((l) => l.id === logId);
      if (!target) {
        return NextResponse.json({ error: "Log entry not found" }, { status: 404 });
      }

      target.isRolledBack = true;
      target.canRollback = false;

      // Add a rollback audit log
      const rollbackLog: AuditLogItem = {
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: "CurrentUser (Rollback)",
        action: "ROLLBACK",
        targetUser: target.targetUser,
        robloxUserId: target.robloxUserId,
        fromRankName: target.toRankName,
        fromRank: target.toRank,
        toRankName: target.fromRankName,
        toRank: target.fromRank,
        reason: `1-Click Rollback of action ${target.id}`,
        method: target.method,
        canRollback: false,
      };

      MOCK_AUDIT.unshift(rollbackLog);

      return NextResponse.json({
        success: true,
        message: `Successfully rolled back ${target.targetUser} back to rank ${target.fromRank} (${target.fromRankName})`,
        rollbackLog,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to process audit action" }, { status: 500 });
  }
}
