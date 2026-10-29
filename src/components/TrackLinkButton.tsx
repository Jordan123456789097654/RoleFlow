"use client";

import React, { useState } from "react";
import { Link2, Check } from "lucide-react";

export function TrackLinkButton({ applicationId, initialToken }: { applicationId: string; initialToken?: string | null }) {
  const [state, setState] = useState<"idle" | "busy" | "copied" | "error">("idle");

  async function copy() {
    setState("busy");
    try {
      let token = initialToken;
      if (!token) {
        const res = await fetch(`/api/applications/${applicationId}/track`, { method: "POST" });
        if (!res.ok) throw new Error("failed");
        token = (await res.json()).token as string;
      }
      await navigator.clipboard.writeText(`${window.location.origin}/track/${token}`);
      setState("copied");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2500);
    }
  }

  return (
    <button type="button" onClick={copy} disabled={state === "busy"} className="btn-ghost btn-sm" title="Anyone with this link can see the status of this application">
      {state === "copied" ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
      {state === "copied" ? "Link copied" : state === "error" ? "Could not copy" : "Copy status link"}
    </button>
  );
}
