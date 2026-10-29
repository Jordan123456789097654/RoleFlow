"use client";

import { useEffect, useState } from "react";

type Reply = { id: string; title: string; content: string; type: string };

/**
 * Dropdown of saved replies for a community, with buttons to save the current text
 * as a new reply or delete the selected one. type filters to ACCEPT / REJECT / ANY.
 */
export default function SavedReplyPicker({
  guildId,
  type = "ANY",
  currentText = "",
  onPick,
}: {
  guildId: string;
  type?: "ANY" | "ACCEPT" | "REJECT";
  currentText?: string;
  onPick: (text: string) => void;
}) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch(`/api/guilds/${guildId}/replies`);
    if (res.ok) setReplies(await res.json());
  };

  useEffect(() => {
    load();
  }, [guildId]);

  const visible = replies.filter((r) => type === "ANY" || r.type === type || r.type === "ANY");

  const pick = (id: string) => {
    setSelected(id);
    const reply = replies.find((r) => r.id === id);
    if (reply) onPick(reply.content);
  };

  const save = async () => {
    if (!currentText.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/guilds/${guildId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: currentText.trim().slice(0, 60), content: currentText, type }),
    });
    setSaving(false);
    if (res.ok) load();
    else setError((await res.json()).error || "Could not save");
  };

  const remove = async () => {
    if (!selected) return;
    await fetch(`/api/guilds/${guildId}/replies?replyId=${selected}`, { method: "DELETE" });
    setSelected("");
    load();
  };

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
      <select
        value={selected}
        onChange={(e) => pick(e.target.value)}
        className="max-w-[11rem] rounded-lg border border-line bg-surface px-2 py-1.5 text-[11px] text-ink focus:outline-none focus:border-accent"
      >
        <option value="">Saved replies</option>
        {visible.map((r) => (
          <option key={r.id} value={r.id}>{r.title}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={save}
        disabled={saving || !currentText.trim()}
        title="Save the current text as a reply"
        className="rounded-lg bg-sunk px-2 py-1.5 text-[11px] text-ink-2 hover:bg-sunk disabled:opacity-40"
      >
        Save
      </button>
      {selected && (
        <button type="button" onClick={remove} className="rounded-lg px-2 py-1.5 text-[11px] text-danger hover:bg-sunk">
          Delete
        </button>
      )}
      {error && <span className="text-[10px] text-danger">{error}</span>}
    </div>
  );
}
