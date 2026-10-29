import { NextResponse } from "next/server";
import { authorizeGuild } from "@/lib/guild-access";
import { buildRoster } from "@/lib/staff-roster";

export const dynamic = "force-dynamic";

/** Staff roster with this week's minutes and quota progress per member. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const access = await authorizeGuild(params.id, "view");
  if (!access.ok) return access.response;
  return NextResponse.json(await buildRoster(params.id));
}
