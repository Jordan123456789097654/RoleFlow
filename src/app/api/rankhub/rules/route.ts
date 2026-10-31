import { NextResponse } from "next/server";
import type { ApplyHubRule } from "@/lib/rankhub-types";

let MOCK_RULES: ApplyHubRule[] = [
  {
    id: "rule_1",
    formId: "form_mod_app",
    formName: "Moderator Application 2026",
    targetRoleId: 7001,
    targetRoleName: "Junior Moderator",
    targetRank: 40,
    autoPromote: true,
    discordNotify: true,
    active: true,
    passedCount: 42,
  },
  {
    id: "rule_2",
    formId: "form_trainee_app",
    formName: "Barista & Trainee Intake",
    targetRoleId: 7002,
    targetRoleName: "Trainee",
    targetRank: 10,
    autoPromote: true,
    discordNotify: false,
    active: true,
    passedCount: 156,
  },
  {
    id: "rule_3",
    formId: "form_dev_contractor",
    formName: "Studio Contractor Onboarding",
    targetRoleId: 7003,
    targetRoleName: "Contractor",
    targetRank: 80,
    autoPromote: false,
    discordNotify: true,
    active: false,
    passedCount: 8,
  },
];

export async function GET() {
  return NextResponse.json({ rules: MOCK_RULES });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { formId, formName, targetRoleId, targetRoleName, targetRank, autoPromote, discordNotify } = body;

    const newRule: ApplyHubRule = {
      id: `rule_${Date.now()}`,
      formId: formId || "form_custom",
      formName: formName || "New ApplyHub Form",
      targetRoleId: Number(targetRoleId) || 7005,
      targetRoleName: targetRoleName || "Staff Member",
      targetRank: Number(targetRank) || 20,
      autoPromote: Boolean(autoPromote),
      discordNotify: Boolean(discordNotify),
      active: true,
      passedCount: 0,
    };

    MOCK_RULES.unshift(newRule);
    return NextResponse.json({ success: true, rule: newRule });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create rule" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    MOCK_RULES = MOCK_RULES.filter((r) => r.id !== id);
  }
  return NextResponse.json({ success: true });
}
