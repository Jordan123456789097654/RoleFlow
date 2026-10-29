import { NextResponse } from "next/server";
import { authorizeGuild } from "@/lib/guild-access";
import { getLiveServers } from "@/lib/live-ops";

export const dynamic = "force-dynamic";

/** Live game servers with player counts, ping, and staff on each server. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "view");
  if (!access.ok) return access.response;
  return NextResponse.json({ servers: await getLiveServers(params.id) });
}
