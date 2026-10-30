import { isPlatformHostName, PARENT_HOST, platformHostNames } from "./platform-hosts";
import { promises as dns } from "dns";
import { prisma } from "./prisma";
import { platformOrigin } from "./platform-origin";

export const PLATFORM_ORIGIN = platformOrigin();
const APP_URL = PLATFORM_ORIGIN;
const VERIFY_LABEL = "_roleflow-verify";
const VERCEL_CNAME = "cname.vercel-dns.com";
const VERCEL_APEX_IP = "76.76.21.21";

const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const BAD_TLDS = ["localhost", "local", "test", "invalid", "example", "internal"];
const RESERVED_ROOTS = ["roleflow.site", "vercel.app", "vercel-dns.com"];

export type DomainFields = {
  customDomain: string | null;
  customDomainVerified: boolean;
  customDomainToken: string | null;
  customDomainVerifiedAt: Date | null;
};

/** Accepts "https://Apply.Example.com/x" and returns "apply.example.com", or null if unusable. */
export function normalizeDomain(input: unknown): string | null {
  let s = String(input ?? "").trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "").split(/[/?#]/)[0].split(":")[0].replace(/\.$/, "");
  if (!s || s.length > 253) return null;
  const labels = s.split(".");
  if (labels.length < 2 || !labels.every((l) => LABEL.test(l))) return null;
  const tld = labels[labels.length - 1];
  if (!/^[a-z]{2,63}$/.test(tld) || BAD_TLDS.includes(tld)) return null;
  for (const root of RESERVED_ROOTS) {
    if (s === root || s.endsWith("." + root)) return null;
  }
  return s;
}

export function verificationRecord(domain: string, token: string) {
  return { type: "TXT", host: `${VERIFY_LABEL}.${domain}`, value: `roleflow-verify=${token}` };
}

/** Root domains (example.com) need an A record; subdomains (apply.example.com) use a CNAME. */
export function routingRecord(domain: string) {
  const labels = domain.split(".");
  if (labels.length === 2) return { type: "A", host: "@", value: VERCEL_APEX_IP };
  return { type: "CNAME", host: labels.slice(0, -2).join("."), value: VERCEL_CNAME };
}

export async function txtRecordMatches(domain: string, token: string): Promise<boolean> {
  try {
    const records = await dns.resolveTxt(`${VERIFY_LABEL}.${domain}`);
    return records.some((parts) => parts.join("") === `roleflow-verify=${token}`);
  } catch {
    return false;
  }
}

/** The shape returned to the dashboard. The token is safe to show: it only proves control of the DNS zone. */
export function describeDomain(g: DomainFields) {
  if (!g.customDomain || !g.customDomainToken) {
    return { domain: null, verified: false, verifiedAt: null, dns: null, available: vercelReady() };
  }
  return {
    domain: g.customDomain,
    verified: g.customDomainVerified,
    verifiedAt: g.customDomainVerifiedAt,
    dns: {
      verification: verificationRecord(g.customDomain, g.customDomainToken),
      routing: routingRecord(g.customDomain),
    },
    available: vercelReady(),
  };
}

/** Where a community's portal lives: its verified custom domain if it has one, otherwise roleflow.site. */
export function publicGuildUrl(g: {
  id: string;
  vanitySlug?: string | null;
  customDomain?: string | null;
  customDomainVerified?: boolean;
}): string {
  if (g.customDomain && g.customDomainVerified) return `https://${g.customDomain}/`;
  return `${APP_URL}/c/${g.vanitySlug || g.id}`;
}

/** Resolves a host to a community, but only for verified domains. */
export async function guildForCustomDomain(domain: string) {
  return prisma.guild.findFirst({
    where: { customDomain: domain, customDomainVerified: true },
    select: { id: true, vanitySlug: true },
  });
}

// ---- Vercel: attaches the domain to the project and issues its TLS certificate ----

export function vercelReady(): boolean {
  return Boolean(process.env.VERCEL_API_TOKEN && process.env.VERCEL_PROJECT_ID);
}

const projectDomains = () => `/v9/projects/${encodeURIComponent(process.env.VERCEL_PROJECT_ID || "")}/domains`;

async function vercel(method: "GET" | "POST" | "DELETE", path: string, body?: unknown) {
  const url = new URL(`https://api.vercel.com${path}`);
  if (process.env.VERCEL_TEAM_ID) url.searchParams.set("teamId", process.env.VERCEL_TEAM_ID);
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const data: any = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function vercelAddDomain(domain: string): Promise<{ ok: boolean; error?: string }> {
  if (!vercelReady()) {
    return { ok: false, error: "Automatic HTTPS is not configured on the server yet. The domain is saved and will go live once it is." };
  }
  const r = await vercel("POST", projectDomains(), { name: domain });
  if (r.ok) return { ok: true };
  if (r.status === 409) {
    // Already attached to this project is fine. Attached to a different project is not.
    const existing = await vercel("GET", `${projectDomains()}/${encodeURIComponent(domain)}`);
    if (existing.ok) return { ok: true };
  }
  return { ok: false, error: r.data?.error?.message || `Vercel returned ${r.status}.` };
}

export async function vercelVerifyDomain(domain: string): Promise<{ verified: boolean; error?: string }> {
  const r = await vercel("POST", `${projectDomains()}/${encodeURIComponent(domain)}/verify`);
  if (!r.ok) return { verified: false, error: r.data?.error?.message || `Vercel returned ${r.status}.` };
  return { verified: Boolean(r.data?.verified) };
}

/** True when DNS points at Vercel. Vercel reports this as "misconfigured" until the routing record is in place. */
export async function vercelRoutingReady(domain: string): Promise<boolean> {
  const pid = encodeURIComponent(process.env.VERCEL_PROJECT_ID || "");
  const r = await vercel("GET", `/v6/domains/${encodeURIComponent(domain)}/config?projectIdOrName=${pid}`);
  return r.ok && r.data?.misconfigured === false;
}

export async function vercelRemoveDomain(domain: string): Promise<void> {
  if (!vercelReady()) return;
  await vercel("DELETE", `${projectDomains()}/${encodeURIComponent(domain)}`).catch(() => undefined);
}

/** True for RoleFlow's own hosts. Anything else is a candidate custom domain. */
export function isPlatformHost(host: string): boolean {
  const h = host.toLowerCase().replace(/:\d+$/, "");
  let own = "roleflow.site";
  try {
    own = new URL(PLATFORM_ORIGIN).hostname;
  } catch {
    /* keep default */
  }
  return isPlatformHostName(h);
}

/** Validates a URL a user wants to return to after login. Only verified custom domains over https pass. */
export async function validCustomReturn(raw: string | null | undefined): Promise<string | null> {
  if (!raw) return null;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || u.port || u.username || u.password) return null;
  const domain = normalizeDomain(u.hostname);
  if (!domain || domain !== u.hostname.toLowerCase()) return null;
  if (!(await guildForCustomDomain(domain))) return null;
  return `${u.origin}${u.pathname}${u.search}`;
}
