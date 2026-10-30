"use client";

import React, { useState } from "react";

type Msg = { ok: boolean; text: string } | null;

const input = "w-full rounded-lg border border-line bg-sunk px-3 py-2 text-xs text-ink font-mono outline-none focus:border-accent";
const small = "rounded-lg border border-line bg-sunk px-2.5 py-1 text-xs font-semibold text-ink-2 hover:bg-surface disabled:opacity-40";

/**
 * Export, load, and import JSON, the same way the policy editor does it.
 * getCurrent returns the JSON text of what is saved now. onImport receives the text the founder pasted or loaded
 * and returns the result to show.
 */
export default function JsonTransfer({
  filename,
  getCurrent,
  onImport,
  hint,
}: {
  filename: string;
  getCurrent: () => string;
  onImport: (raw: string) => Promise<{ ok: boolean; text: string }>;
  hint: string;
}) {
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);

  const loadCurrent = () => {
    setText(getCurrent());
    setMsg({ ok: true, text: "Current content copied into the box. Edit it, then import." });
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([getCurrent()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then((t) => {
      setText(t);
      setMsg({ ok: true, text: `Loaded ${f.name}. Check it, then import.` });
    });
  };

  const doImport = async () => {
    setMsg(null);
    try {
      JSON.parse(text);
    } catch (err: any) {
      return setMsg({ ok: false, text: `That is not valid JSON: ${err.message}` });
    }
    setBusy(true);
    const result = await onImport(text);
    setBusy(false);
    setMsg(result);
  };

  return (
    <div className="space-y-3 rounded-xl border border-line p-4">
      <div>
        <p className="text-[11px] font-semibold text-muted">Import and export JSON</p>
        <p className="text-xs text-muted mt-1">{hint}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button className={small} onClick={loadCurrent}>Load current into box</button>
        <button className={small} onClick={download}>Download {filename}</button>
        <label className={`${small} cursor-pointer`}>
          Load file
          <input type="file" accept="application/json,.json" className="hidden" onChange={loadFile} />
        </label>
      </div>
      <textarea rows={8} className={input} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste JSON here, or load a file" />
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={doImport} disabled={busy || !text.trim()} className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-40">
          {busy ? "Importing..." : "Import JSON"}
        </button>
      </div>
      {msg && <p className={`text-xs ${msg.ok ? "text-emerald-500" : "text-rose-500"}`}>{msg.text}</p>}
    </div>
  );
}
