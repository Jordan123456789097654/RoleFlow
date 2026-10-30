import { headers } from "next/headers";
import { isApplicationsHost } from "@/lib/platform-hosts";
import ApplyHubHomePage from "./ApplyHubHomePage";
import ParentHomePage from "./parent/ParentHomePage";

export const dynamic = "force-dynamic";

export default async function DynamicRootPage() {
  const h = headers();
  const host = (h.get("x-forwarded-host") || h.get("host") || "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");

  // When visited on the ApplyHub host (applyhub.roleflow.site), render the application platform home
  if (isApplicationsHost(host)) {
    return <ApplyHubHomePage />;
  }

  // Otherwise (roleflow.site, localhost, preview), render the parent company site
  return <ParentHomePage />;
}
