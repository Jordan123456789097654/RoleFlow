"use client";

import React, { useState } from "react";

export function GameSecretPanel({
  guildId,
  configured,
  rotatedAt,
  canManage,
}: {
  guildId: string;
  configured: boolean;
  rotatedAt: string | null;
  canManage: boolean;
}) {
  const [secret, setSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(configured);
  const [rotated, setRotated] = useState(rotatedAt);

  async function rotate() {
    const msg = isConfigured
      ? "Generate a new secret? The current one stops working immediately and every game server must be updated."
      : "Generate a game secret?";
    if (!window.confirm(msg)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/guilds/${guildId}/game/secret`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not generate a secret");
      setSecret(data.secret);
      setIsConfigured(true);
      setRotated(new Date().toISOString());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 rounded-xl border border-line p-5">
      <p className="text-[14px] font-medium text-ink">Game server secret</p>
      <p className="mt-1 text-[13px] text-muted">
        {isConfigured
          ? `Configured${rotated ? `, last generated ${new Date(rotated).toLocaleDateString()}` : ""}.`
          : "Not configured. Generate a secret and paste it into your Roblox game's tracker script."}
      </p>

      {secret && (
        <div className="mt-4">
          <p className="text-[12px] text-accent">Copy this now. It will not be shown again.</p>
          <code className="mt-2 block break-all rounded-lg bg-sunk p-3 text-[13px] text-ink">{secret}</code>
        </div>
      )}

      {error && <p className="mt-3 text-[13px] text-red-700">{error}</p>}

      {canManage && (
        <button
          onClick={rotate}
          disabled={busy}
          className="mt-4 rounded-lg bg-accent px-4 py-2 text-[14px] font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {busy ? "Generating…" : isConfigured ? "Generate new secret" : "Generate secret"}
        </button>
      )}
    </div>
  );
}
