"use client";

import React, { useState } from "react";

type DataItem = { key: string; label: string; help: string };

const DATA_ITEMS: DataItem[] = [
  {
    key: "email",
    label: "Email address",
    help: "Removes the email stored on your RoleFlow account and turns off email notifications. It is not copied back from Discord when you sign in again.",
  },
  {
    key: "companyEmail",
    label: "Verified company email",
    help: "Removes your verified company address and any pending verification code.",
  },
  {
    key: "robloxLink",
    label: "Roblox link",
    help: "Removes your linked Roblox ID, username, and avatar. You can link again at any time.",
  },
  {
    key: "savedProfile",
    label: "Saved profile answers",
    help: "Removes the answers you chose to remember for future applications.",
  },
  {
    key: "applicationDrafts",
    label: "Server copies of drafts",
    help: "Removes unsubmitted application drafts saved to your account. Drafts kept in this browser are not affected.",
  },
  {
    key: "loginDevices",
    label: "Recorded devices",
    help: "Removes the browser records used for new-device alerts. Your next sign-in may trigger a new-device notice.",
  },
];

export default function RemoveDataPanel({ onDone }: { onDone?: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function remove(item: DataItem) {
    if (!window.confirm(`Remove ${item.label.toLowerCase()} from your account?`)) return;
    setBusy(item.key);
    setMessage(null);
    try {
      const res = await fetch("/api/user/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: item.key }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not remove this item.");
      setMessage(`${item.label} removed.`);
      onDone?.();
    } catch (err: any) {
      setMessage(err?.message || "Could not remove this item.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="p-5 rounded-2xl bg-sunk border border-line space-y-4">
      <div>
        <h4 className="text-xs font-bold text-ink">Remove specific data</h4>
        <p className="text-[11px] text-muted mt-0.5">
          Remove individual pieces of information without closing your account. Applications you have already submitted are
          held by the community they were sent to; withdraw them from the application page if you want them removed from review.
        </p>
      </div>

      <ul className="divide-y divide-line">
        {DATA_ITEMS.map((item) => (
          <li key={item.key} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-ink">{item.label}</p>
              <p className="text-[11px] text-muted mt-0.5">{item.help}</p>
            </div>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => remove(item)}
              className="px-4 py-2 rounded-xl bg-surface hover:bg-sunk text-ink-2 text-xs font-semibold border border-line transition-all shrink-0 disabled:opacity-40"
            >
              {busy === item.key ? "Removing..." : "Remove"}
            </button>
          </li>
        ))}
      </ul>

      {message && <p className="text-[11px] text-ink-2">{message}</p>}
    </div>
  );
}
