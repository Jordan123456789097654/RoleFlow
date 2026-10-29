"use client";

import { useEffect, useState } from "react";

type Check = {
  linked: boolean;
  username: string | null;
  accountAgeDays: number | null;
  group: { status: "member" | "not_member" | "unknown"; roleName: string | null; rank: number | null; groupId: string | null } | null;
};

/** Shows an applicant's Roblox account age and group standing next to their application. */
export default function RobloxCheck({ applicationId }: { applicationId: string }) {
  const [data, setData] = useState<Check | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/applications/${applicationId}/roblox-check`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Could not load Roblox details.");
        setData(body);
      })
      .catch((e) => setError(e.message));
  }, [applicationId]);

  if (error) return <p className="text-xs text-red-500">{error}</p>;
  if (!data) return <p className="text-xs text-faint">Checking Roblox…</p>;
  if (!data.linked) return <p className="text-xs text-muted">No Roblox account linked.</p>;

  const groupText =
    !data.group ? "No group check set up"
    : data.group.status === "member" ? `In group · ${data.group.roleName} (rank ${data.group.rank})`
    : data.group.status === "not_member" ? "Not in group"
    : "Group status unavailable";

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
      <dt className="text-faint">Roblox</dt>
      <dd className="text-ink">{data.username ?? "Unknown"}</dd>
      <dt className="text-faint">Account age</dt>
      <dd className="text-ink">{data.accountAgeDays === null ? "Unavailable" : `${data.accountAgeDays} days`}</dd>
      <dt className="text-faint">Group</dt>
      <dd className="text-ink">{groupText}</dd>
    </dl>
  );
}
