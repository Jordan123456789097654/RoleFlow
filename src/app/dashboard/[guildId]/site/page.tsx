import React from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { authorizeGuild } from "@/lib/guild-access";
import { loadSite } from "@/lib/site-data";
import { SiteConfigForm } from "@/components/dashboard/SiteConfigForm";
import { ArrowLeft } from "lucide-react";

export const revalidate = 0;

export default async function SitePage({ params }: { params: { guildId: string } }) {
  const access = await authorizeGuild(params.guildId, "manage");
  if (!access.ok) redirect("/dashboard");

  const site = await loadSite(params.guildId);
  if (!site) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-6">
      <Link href={`/dashboard/${params.guildId}`} className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to dashboard
      </Link>
      <div className="mt-6 mb-8">
        <p className="eyebrow">Custom domain site</p>
        <h1 className="display-lg mt-2">Customize your site</h1>
        <p className="mt-2 max-w-2xl text-[14px] text-muted">
          Control how your community looks on its own domain: colors, layout, copy, links, and what the header and footer show.
          Changes appear on your site as soon as you save.
        </p>
      </div>
      <SiteConfigForm initial={site} />
    </div>
  );
}
