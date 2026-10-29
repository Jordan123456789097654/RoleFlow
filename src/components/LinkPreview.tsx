"use client";

import { useEffect, useState } from "react";

type Preview = { url: string; title: string | null; description: string | null; image: string | null };

/** Card preview for a link in an application answer. Shows nothing if the link can't be previewed. */
export default function LinkPreview({ url }: { url: string }) {
  const [data, setData] = useState<Preview | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok || body.error) throw new Error(body.error || "unavailable");
        if (!cancelled) setData(body);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!data) return null;

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="mt-2 flex gap-3 rounded-lg border border-line bg-sunk p-3 text-xs hover:border-ink"
    >
      {data.image && <img src={data.image} alt="" className="h-14 w-20 shrink-0 rounded object-cover" />}
      <span className="min-w-0">
        <span className="block truncate font-semibold text-ink">{data.title ?? data.url}</span>
        {data.description && <span className="line-clamp-2 text-muted">{data.description}</span>}
      </span>
    </a>
  );
}
