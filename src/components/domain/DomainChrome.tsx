import React from "react";
import { readSiteConfig, type SiteConfig } from "@/lib/site-config";

export type DomainBrand = {
  name: string;
  icon: string | null;
  portalAccentColor: string | null;
  siteConfig: unknown;
};

/** Header and footer for a community's own domain. No RoleFlow navigation; only a small "Powered by" line. */
export function DomainHeader({
  brand,
  user,
}: {
  brand: DomainBrand;
  user: { username: string } | null;
}) {
  const site = readSiteConfig(brand.siteConfig);
  if (!site.showHeader) return null;
  const initial = brand.name.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="h-1 w-full" style={{ background: "var(--accent)" }} aria-hidden="true" />
      <div className="page-wrap flex h-16 items-center justify-between gap-4">
        <a href="/" className="flex min-w-0 items-center gap-3" aria-label={`${brand.name} home`}>
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md border border-line-strong bg-surface">
            {brand.icon ? (
              <img src={brand.icon} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-[17px] text-ink">{initial}</span>
            )}
          </span>
          <span className="truncate font-display text-[18px] font-semibold tracking-tight text-ink">{brand.name}</span>
        </a>

        {site.headerLinks.length > 0 && (
          <nav className="hidden items-center gap-5 md:flex" aria-label="Site">
            {site.headerLinks.map((l) => (
              <a key={l.url + l.label} href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="text-[13px] text-ink-2 hover:text-ink">
                {l.label}
              </a>
            ))}
          </nav>
        )}

        {user ? (
          <span className="hidden truncate text-[13px] text-muted sm:inline">Signed in as {user.username}</span>
        ) : (
          <a href="/api/auth/login" className="btn-primary btn-sm shrink-0">
            {site.buttonLabel}
          </a>
        )}
      </div>
    </header>
  );
}

export function DomainFooter({ site }: { site: SiteConfig }) {
  return (
    <footer className="mt-24 border-t border-line">
      {site.showFooter && (
        <div className="page-wrap flex flex-col gap-4 py-8 text-[13px] text-muted sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl space-y-2">
            {site.footerNote && <p className="text-ink-2">{site.footerNote}</p>}
          </div>
          {site.footerLinks.length > 0 && (
            <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer">
              {site.footerLinks.map((l) => (
                <a key={l.url + l.label} href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="text-ink-2 underline-offset-4 hover:text-ink hover:underline">
                  {l.label}
                </a>
              ))}
            </nav>
          )}
        </div>
      )}
      {/* Always shown: the one RoleFlow line. */}
      <div className="page-wrap pb-8 text-[12px] text-faint">
        <p className="font-mono">
          Powered by{" "}
          <a href="https://roleflow.site" target="_blank" rel="noopener noreferrer" className="text-muted underline underline-offset-4 hover:text-ink">
            RoleFlow
          </a>
        </p>
      </div>
    </footer>
  );
}
