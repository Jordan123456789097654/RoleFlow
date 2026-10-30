"use client";

import React, { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { UnveilPreview } from "@/components/unveil/UnveilPreview";

type State = { active: boolean; targetDate: string | null; launchEmailsSent: boolean };

const card = "rounded-xl border border-line bg-surface p-5 shadow-card";

export function LockdownCountdownEditor() {
  const [state, setState] = useState<State | null>(null);
  const [local, setLocal] = useState("");
  const [active, setActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [showUnveil, setShowUnveil] = useState(false);

  useEffect(() => {
    fetch("/api/admin/lockdown")
      .then((r) => r.json())
      .then((data: State) => {
        setState(data);
        setActive(data.active);
        setLocal(data.targetDate ? toLocalInput(data.targetDate) : "");
      })
      .catch(() => setMessage({ ok: false, text: "Could not load the lockdown settings." }));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/lockdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          targetDate: local ? new Date(local).toISOString() : null,
          active,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ ok: false, text: data.error || "Save failed." });
        return;
      }
      setState(data);
      setMessage({ ok: true, text: "Lockdown countdown saved." });
    } catch {
      setMessage({ ok: false, text: "Network error. Nothing was saved." });
    } finally {
      setSaving(false);
    }
  }

  async function turnOff() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/lockdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lockdown_off" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ ok: false, text: data.error || "Could not turn the lockdown off." });
        return;
      }
      setState(data);
      setActive(false);
      setMessage({ ok: true, text: "Lockdown turned off. The public site is open." });
    } catch {
      setMessage({ ok: false, text: "Network error. The lockdown is unchanged." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={card}>
      <div className="flex items-center gap-3">
        <Lock className="h-5 w-5 text-accent" />
        <h3 className="text-sm font-bold text-ink">Launch Lockdown Countdown</h3>
      </div>
      <p className="mt-1 text-xs text-muted">
        Public visitors see the countdown screen until this time. Staff see it too, with a button to continue past it.
      </p>

      {!state ? (
        <p className="mt-4 text-xs text-muted">Loading...</p>
      ) : (
        <form onSubmit={save} className="mt-5 space-y-4">
          <div>
            <label htmlFor="lockdown-target" className="mb-1 block text-xs font-medium text-ink">Unlock date and time</label>
            <input
              id="lockdown-target"
              type="datetime-local"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              className="field-sm"
            />
            <span className="hint">Shown in your browser's time zone. The public page shows it in New York time.</span>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-ink">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Lockdown is on
          </label>

          <p className="text-xs text-muted">
            Launch emails: {state.launchEmailsSent ? "already sent for the current date" : "not sent yet"}.
            Saving a future date lets them send again at that time.
          </p>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setShowUnveil(true)} className="btn-ghost btn-sm">
              Show unlock animation
            </button>
            <button type="submit" disabled={saving} className="btn-primary btn-sm disabled:opacity-50">
              {saving ? "Saving..." : "Save lockdown"}
            </button>
            {state.active && (
              <button type="button" onClick={turnOff} disabled={saving} className="btn-ghost btn-sm disabled:opacity-50">
                Turn lockdown off now
              </button>
            )}
          </div>

          {message && (
            <p role="status" className={`text-xs ${message.ok ? "text-moss" : "text-danger"}`}>
              {message.text}
            </p>
          )}
        </form>
      )}
      {showUnveil && <UnveilPreview onClose={() => setShowUnveil(false)} />}
    </section>
  );
}

/** ISO string to the "YYYY-MM-DDTHH:mm" value a datetime-local input expects, in the browser's zone. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
