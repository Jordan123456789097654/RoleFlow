/**
 * Single source of truth for all platform hosts, domains, and redirect endpoints.
 */
export const PARENT_HOST = "roleflow.site";
export const PARENT_ORIGIN = `https://${PARENT_HOST}`;

/** The application platform host (ApplyHub). Reads from env if provided, falls back to applyhub.roleflow.site */
export const APPLICATIONS_HOST = process.env.NEXT_PUBLIC_APPLICATIONS_HOST || "applyhub.roleflow.site";
export const APPLICATIONS_ORIGIN = `https://${APPLICATIONS_HOST}`;

/**
 * The fixed Discord OAuth callback URL configured in the Discord Developer Portal.
 * DO NOT CHANGE THIS URL as it is registered with Discord.
 */
export const DISCORD_CALLBACK_URL = "https://roleflow.site/api/auth/callback";

/** Shared cookie domain for SSO across roleflow.site and all *.roleflow.site subdomains */
export const DEFAULT_COOKIE_DOMAIN = ".roleflow.site";

/**
 * Returns a list of all normalized platform host names.
 */
export function platformHostNames(): string[] {
  const hosts = new Set<string>();

  hosts.add(PARENT_HOST.toLowerCase());
  hosts.add(`www.${PARENT_HOST}`.toLowerCase());
  hosts.add(APPLICATIONS_HOST.toLowerCase());

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim();
  if (appUrl) {
    try {
      const url = new URL(appUrl);
      if (url.hostname) {
        hosts.add(url.hostname.toLowerCase());
      }
    } catch {
      // ignore
    }
  }

  const extra = process.env.PLATFORM_EXTRA_HOSTS || "";
  for (const h of extra.split(",")) {
    const trimmed = h.trim().toLowerCase();
    if (trimmed) hosts.add(trimmed);
  }

  return Array.from(hosts);
}

/**
 * Checks whether a given request host belongs to the platform infrastructure
 * (and should never be treated as a third-party community custom domain).
 */
export function isPlatformHostName(host: string | null | undefined): boolean {
  if (!host) return false;

  // Strip port and trailing dots, lowercase
  const normalized = host.split(":")[0].replace(/\.+$/, "").trim().toLowerCase();
  if (!normalized) return false;

  // Local development
  if (normalized === "localhost" || normalized === "127.0.0.1" || normalized.endsWith(".localhost")) {
    return true;
  }

  // Vercel deployment preview / branch domains
  if (normalized.endsWith(".vercel.app")) {
    return true;
  }

  // Exact platform host match
  const platformHosts = platformHostNames();
  return platformHosts.includes(normalized);
}
