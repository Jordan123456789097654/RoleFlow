import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { getFounderCaller } from "@/lib/staff-access";
import { TEMPLATES, CATEGORIES } from "@/lib/email-templates";
import { TemplateInputError } from "@/lib/email-templates";
import { BulkError, LIVE_BATCH_LIMIT, createCampaign, discardDraft, eligibleCount, sendSingle, staffEligibleCount, sendNextBatch, sendTest } from "@/lib/bulk-email";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function fail(err: unknown) {
  if (err instanceof TemplateInputError) return NextResponse.json({ error: err.message }, { status: 400 });
  if (err instanceof BulkError) return NextResponse.json({ error: err.message }, { status: 409 });
  console.error("Bulk email error:", err);
  return NextResponse.json({ error: "Something went wrong. Nothing else was changed." }, { status: 500 });
}

/** Templates, eligible audience size, and recent campaigns. */
export async function GET() {
  const caller = await getFounderCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [audience, staffAudience, campaigns] = await Promise.all([
    eligibleCount(),
    staffEligibleCount(),
    prisma.bulkCampaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      select: { id: true, name: true, templateId: true, status: true, totalSent: true, totalFailed: true, createdAt: true, updatedAt: true },
    }),
  ]);

  return NextResponse.json({
    categories: CATEGORIES,
    templates: TEMPLATES.map((t) => ({ id: t.id, name: t.name, category: t.category, audience: t.audience ?? "all", description: t.description, fields: t.fields })),
    audience,
    staffAudience,
    batchLimit: LIVE_BATCH_LIMIT,
    campaigns,
  });
}

/**
 * action: "test"    sends one copy of the template to the founder's own address
 *         "create"  stores a draft campaign (sends nothing)
 *         "send"    sends the next batch; requires confirm === "SEND"
 *         "discard" deletes a draft that has never sent
 */
export async function POST(request: Request) {
  const caller = await getFounderCaller();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const action = String(body.action ?? "");

  try {
    if (action === "test") {
      const me = await prisma.user.findUnique({ where: { id: caller.id }, select: { email: true, username: true } });
      if (!me?.email) return NextResponse.json({ error: "Your account has no email address to send a test to." }, { status: 400 });
      const result = await sendTest({
        templateId: String(body.templateId ?? ""),
        values: body.values ?? {},
        to: me.email,
        name: me.username,
      });
      await recordAudit({ actorId: caller.id, action: "BULK_EMAIL_TEST", details: { templateId: body.templateId } });
      return NextResponse.json(result);
    }

    if (action === "create") {
      const campaign = await createCampaign({
        name: String(body.name ?? ""),
        templateId: String(body.templateId ?? ""),
        values: body.values ?? {},
        createdById: caller.id,
      });
      await recordAudit({ actorId: caller.id, action: "BULK_EMAIL_CREATED", targetId: campaign.id, details: { templateId: campaign.templateId, name: campaign.name } });
      return NextResponse.json({ campaign: { id: campaign.id, name: campaign.name, status: campaign.status } });
    }

    if (action === "send") {
      const campaignId = String(body.campaignId ?? "");
      if (body.confirm !== "SEND") {
        return NextResponse.json({ error: 'Type SEND to confirm.' }, { status: 400 });
      }
      const result = await sendNextBatch(campaignId);
      await recordAudit({
        actorId: caller.id,
        action: "BULK_EMAIL_BATCH",
        targetId: campaignId,
        details: { sent: result.sent, failed: result.failed, remaining: result.remaining, status: result.status },
      });
      return NextResponse.json(result);
    }

    if (action === "sendOne") {
      if (body.confirm !== "SEND") return NextResponse.json({ error: "Type SEND to confirm." }, { status: 400 });
      const result = await sendSingle({
        templateId: String(body.templateId ?? ""),
        values: body.values ?? {},
        email: String(body.email ?? ""),
        actorId: caller.id,
      });
      await recordAudit({ actorId: caller.id, action: "BULK_EMAIL_SINGLE", targetId: null, details: { templateId: body.templateId, email: result.email } });
      return NextResponse.json(result);
    }

    if (action === "discard") {
      const campaignId = String(body.campaignId ?? "");
      await discardDraft(campaignId);
      await recordAudit({ actorId: caller.id, action: "BULK_EMAIL_DISCARDED", targetId: campaignId });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    return fail(err);
  }
}
