import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Reports now live in the support panel. Kept so existing links still work. */
export default function SupportWorkspacePage() {
  redirect("/support/panel#reports");
}
