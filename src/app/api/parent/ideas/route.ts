import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { isSiteAdminUser } from "@/lib/roles";
import { verifySessionValue } from "@/lib/session";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function ipHash(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const ip = fwd.split(",")[0].trim();
  return createHash("sha256").update(ip + "roleflow_idea_salt").digest("hex").slice(0, 16);
}

// Default initial roadmap items if database table is empty
const INITIAL_IDEAS = [
  {
    title: "Discord Bot Automated Attendance & Shift Logging",
    description: "Allow Roblox group staff to clock-in via Discord slash command, tracking total active hours and generating weekly activity scores.",
    category: "DISCORD",
    status: "PLANNED",
    upvotes: 42,
  },
  {
    title: "Roblox Group Hierarchy & Department Trees",
    description: "Visual department builder for complex studios with multiple sub-groups, divisional branches, and rank requirements.",
    category: "ROBLOX",
    status: "IN_PROGRESS",
    upvotes: 38,
  },
  {
    title: "Multi-Reviewer Interview Scheduling & Booking",
    description: "Integrated Calendly-style interview slots for accepted applicants to book times directly with community review staff.",
    category: "AUTOMATION",
    status: "UNDER_REVIEW",
    upvotes: 27,
  },
];

export async function GET(req: Request) {
  try {
    let ideas = await prisma.communityIdea.findMany({
      orderBy: { upvotes: "desc" },
    });

    if (ideas.length === 0) {
      // Seed default roadmap ideas
      for (const item of INITIAL_IDEAS) {
        await prisma.communityIdea.create({ data: item });
      }
      ideas = await prisma.communityIdea.findMany({ orderBy: { upvotes: "desc" } });
    }

    const voter = ipHash(req);
    const enriched = ideas.map((idea) => {
      let voted = false;
      if (idea.voterIps) {
        try {
          const list = JSON.parse(idea.voterIps);
          voted = Array.isArray(list) && list.includes(voter);
        } catch {}
      }
      return {
        id: idea.id,
        title: idea.title,
        description: idea.description,
        authorName: idea.authorName,
        category: idea.category,
        status: idea.status,
        upvotes: idea.upvotes,
        hasVoted: voted,
        createdAt: idea.createdAt,
      };
    });

    return NextResponse.json({ ideas: enriched });
  } catch (err) {
    return NextResponse.json({ ideas: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, ideaId, title, description, category, authorName } = body;
    const voter = ipHash(req);

    // Upvote action
    if (action === "upvote") {
      if (!ideaId) return NextResponse.json({ error: "Missing idea ID." }, { status: 400 });

      const idea = await prisma.communityIdea.findUnique({ where: { id: ideaId } });
      if (!idea) return NextResponse.json({ error: "Idea not found." }, { status: 404 });

      let voterList: string[] = [];
      try {
        if (idea.voterIps) voterList = JSON.parse(idea.voterIps);
      } catch {}

      if (voterList.includes(voter)) {
        // Toggle downvote / remove vote
        voterList = voterList.filter((v) => v !== voter);
        const updated = await prisma.communityIdea.update({
          where: { id: ideaId },
          data: {
            upvotes: Math.max(1, idea.upvotes - 1),
            voterIps: JSON.stringify(voterList),
          },
        });
        return NextResponse.json({ success: true, upvotes: updated.upvotes, hasVoted: false });
      } else {
        // Add upvote
        voterList.push(voter);
        const updated = await prisma.communityIdea.update({
          where: { id: ideaId },
          data: {
            upvotes: idea.upvotes + 1,
            voterIps: JSON.stringify(voterList),
          },
        });
        return NextResponse.json({ success: true, upvotes: updated.upvotes, hasVoted: true });
      }
    }

    // Submit new idea action
    if (action === "submit") {
      if (!title || typeof title !== "string" || title.trim().length < 5) {
        return NextResponse.json({ error: "Please enter a descriptive title (at least 5 characters)." }, { status: 400 });
      }
      if (!description || typeof description !== "string" || description.trim().length < 15) {
        return NextResponse.json({ error: "Please explain your idea in more detail (at least 15 characters)." }, { status: 400 });
      }

      const created = await prisma.communityIdea.create({
        data: {
          title: title.trim().slice(0, 140),
          description: description.trim().slice(0, 1000),
          authorName: authorName ? authorName.trim().slice(0, 50) : "Community Member",
          category: category || "GENERAL",
          status: "UNDER_REVIEW",
          upvotes: 1,
          voterIps: JSON.stringify([voter]),
        },
      });

      return NextResponse.json({ success: true, idea: created });
    }

    // Admin change status
    if (action === "set_status") {
      const userId = await verifySessionValue(cookies().get("roleflow_user_id")?.value);
      if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { isSiteAdmin: true, siteRole: true } });
      if (!user || !isSiteAdminUser(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      const { status } = body;
      const updated = await prisma.communityIdea.update({
        where: { id: ideaId },
        data: { status },
      });
      return NextResponse.json({ success: true, idea: updated });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
