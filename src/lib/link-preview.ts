import { isIP } from "net";
import { lookup } from "dns/promises";

/** True for addresses on private, loopback, link-local, or reserved networks. */
export function isPrivateAddress(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v.startsWith("::ffff:")) return isPrivateAddress(v.slice(7));
  const family = isIP(v);
  if (family === 4) {
    const [a, b] = v.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    );
  }
  if (family === 6) {
    return (
      v === "::" ||
      v === "::1" ||
      v.startsWith("fc") ||
      v.startsWith("fd") ||
      v.startsWith("fe8") ||
      v.startsWith("fe9") ||
      v.startsWith("fea") ||
      v.startsWith("feb")
    );
  }
  return true;
}

/** Only public https URLs without credentials or unusual ports are previewed. */
export function isSafeUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.port && url.port !== "443") return null;
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return null;
  if (isIP(host) && isPrivateAddress(host)) return null;
  return url;
}

export type LinkPreviewData = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

/** Reads Open Graph tags (with fallbacks) from a page's HTML. */
export function parseOpenGraph(html: string, pageUrl: string): Omit<LinkPreviewData, "url"> {
  const meta = (key: string): string | null => {
    const a = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["'][^>]*>`, "i");
    const b = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["'][^>]*>`, "i");
    const m = html.match(a) || html.match(b);
    return m?.[1]?.trim() || null;
  };
  const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || null;

  let image: string | null = null;
  const rawImage = meta("og:image");
  if (rawImage) {
    try {
      const u = new URL(rawImage, pageUrl);
      if (u.protocol === "https:") image = u.toString();
    } catch {
      image = null;
    }
  }

  return {
    title: meta("og:title") || titleTag,
    description: meta("og:description") || meta("description"),
    image,
    siteName: meta("og:site_name"),
  };
}

/** Fetches a public https page and returns its preview, or an error message. */
export async function fetchLinkPreview(raw: string): Promise<LinkPreviewData | { error: string }> {
  const url = isSafeUrl(raw);
  if (!url) return { error: "Only public https links can be previewed." };

  const addresses = await lookup(url.hostname, { all: true }).catch(() => []);
  if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) {
    return { error: "That link can't be previewed." };
  }

  const res = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(5000),
    headers: { Accept: "text/html", "User-Agent": "RoleFlowLinkPreview/1.0" },
    cache: "no-store",
  });
  if (res.status >= 300 && res.status < 400) return { error: "Redirecting links aren't previewed." };
  if (!res.ok) return { error: "Couldn't load that link." };
  if (!(res.headers.get("content-type") || "").includes("text/html")) return { error: "That link isn't a web page." };

  const html = (await res.text()).slice(0, 256 * 1024);
  return { url: url.toString(), ...parseOpenGraph(html, url.toString()) };
}
