"use client";

import Link from "next/link";
import DocsPageEditor from "@/components/founder/DocsPageEditor";

export default function FounderDocsPage() {
  return (
    <div className="page-wrap py-12 sm:py-16 space-y-8">
      <div>
        <Link href="/founder" className="text-[13px] text-muted hover:text-ink">Back to founder console</Link>
        <p className="eyebrow mt-6 mb-3">Founder</p>
        <h1 className="display-md">Documentation editor</h1>
        <p className="mt-3 text-sm text-muted max-w-2xl">Edit the public /docs page, or import and export it as JSON. Publishing goes live straight away, and earlier versions can be restored.</p>
      </div>
      <DocsPageEditor />
    </div>
  );
}
