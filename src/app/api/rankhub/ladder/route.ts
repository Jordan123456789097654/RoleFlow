import { NextResponse } from "next/server";
import type { RankLadderRole } from "@/lib/rankhub-types";

const MOCK_LADDER: RankLadderRole[] = [
  { id: 101, name: "Holder / Group Owner", rank: 255, memberCount: 1, isProtected: true },
  { id: 102, name: "Co-Owner & Executive", rank: 254, memberCount: 2, isProtected: true },
  { id: 103, name: "Board of Directors", rank: 250, memberCount: 4, isProtected: true, isCeiling: true },
  { id: 104, name: "Head of Operations", rank: 180, memberCount: 6 },
  { id: 105, name: "Lead Developer", rank: 150, memberCount: 12 },
  { id: 106, name: "Senior Developer", rank: 120, memberCount: 24 },
  { id: 107, name: "Department Supervisor", rank: 90, memberCount: 38 },
  { id: 108, name: "Senior Moderator", rank: 60, memberCount: 82 },
  { id: 109, name: "Junior Moderator", rank: 40, memberCount: 145 },
  { id: 110, name: "Staff Member", rank: 20, memberCount: 310 },
  { id: 111, name: "Trainee", rank: 10, memberCount: 840 },
  { id: 112, name: "Community Member", rank: 2, memberCount: 18450 },
  { id: 113, name: "Guest", rank: 1, memberCount: 5210 },
];

export async function GET() {
  return NextResponse.json({
    roles: MOCK_LADDER,
    ceilingRank: 200,
    protectedRanks: [250, 254, 255],
  });
}
