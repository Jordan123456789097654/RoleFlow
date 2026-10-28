import { isFounderId } from "@/lib/roles";
import { verifySessionValue } from "@/lib/session";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // BUG_REPORT or FEATURE_SUGGESTION
    const status = searchParams.get("status");

    const reports = await prisma.feedbackReport.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reports);
  } catch (err) {
    console.error("Fetch feedback error:", err);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = await verifySessionValue(cookieStore.get("roleflow_user_id")?.value);

    let authorId = null;
    let authorName = null;

    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        authorId = user.id;
        authorName = user.username;
      }
    }

    const body = await request.json();
    const type = body.type === "FEATURE_SUGGESTION" ? "FEATURE_SUGGESTION" : "BUG_REPORT";
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const severity = body.severity || "NORMAL";
    const category = body.category || "OTHER";

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    const report = await prisma.feedbackReport.create({
      data: {
        type,
        title,
        description,
        severity,
        category,
        authorId,
        authorName: authorName || body.guestName || "Anonymous Member",
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (err) {
    console.error("Submit feedback error:", err);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = await verifySessionValue(cookieStore.get("roleflow_user_id")?.value);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isStaffOrAdmin = currentUser?.isSupportStaff || currentUser?.isSiteAdmin || isFounderId(currentUser?.id);

    if (!isStaffOrAdmin) {
      return NextResponse.json({ error: "Forbidden: Staff authority required" }, { status: 403 });
    }

    const { id, status, adminNotes } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 });
    }

    const updated = await prisma.feedbackReport.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
      },
    });

    return NextResponse.json({ success: true, report: updated });
  } catch (err) {
    console.error("Update feedback error:", err);
    return NextResponse.json({ error: "Failed to update report status" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = await verifySessionValue(cookieStore.get("roleflow_user_id")?.value);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const isFounder = currentUser?.isSiteAdmin || isFounderId(currentUser?.id);

    if (!isFounder) {
      return NextResponse.json({ error: "Forbidden: Founder access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.feedbackReport.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete feedback error:", err);
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
  }
}
