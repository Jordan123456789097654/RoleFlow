import SupportWorkspace from "@/components/support/SupportWorkspace";

export const dynamic = "force-dynamic";

export default function SupportWorkspacePage() {
  return (
    <div className="page-wrap py-12 sm:py-16 space-y-8">
      <div>
        <p className="eyebrow mb-3">Support</p>
        <h1 className="display-md">Support workspace</h1>
        <p className="mt-3 text-sm text-muted max-w-2xl">File the report for every ticket you handle in Discord, look up accounts, remove data with a logged reason, and review the removal log.</p>
      </div>
      <SupportWorkspace />
    </div>
  );
}
