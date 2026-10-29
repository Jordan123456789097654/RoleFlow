"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function AppealForm() {
  const token = useSearchParams().get("token");
  const [info, setInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return setError("This page needs the link from your email.");
    fetch(`/api/appeals?token=${encodeURIComponent(token)}`).then(async (r) => {
      const d = await r.json();
      if (!r.ok) setError(d.error);
      else setInfo(d);
    });
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/appeals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, text }),
    });
    const d = await res.json();
    if (res.ok) setDone(true);
    else setError(d.error);
  };

  return (
    <main className="page-wrap flex min-h-[80vh] items-center justify-center py-16">
      <div className="card w-full max-w-lg p-8 sm:p-10">
        <p className="eyebrow mb-3">Trust &amp; Safety</p>
        <h1 className="display-md">Appeal a decision</h1>

        {error && <p role="alert" className="mt-5 rounded-md border border-danger bg-danger-soft px-4 py-3 text-[14px] text-danger">{error}</p>}
        {done && <p role="status" className="mt-5 rounded-md border border-moss bg-moss-soft px-4 py-3 text-[14px] text-moss-ink">Your appeal was submitted. You will be emailed when it is reviewed.</p>}

        {info && !done && (
          <>
            <dl className="mt-6 divide-y divide-line rounded-md border border-line bg-sunk text-[14px]">
              <div className="flex gap-4 px-4 py-3"><dt className="w-20 shrink-0 text-muted">Action</dt><dd className="text-ink">{info.action}</dd></div>
              <div className="flex gap-4 px-4 py-3"><dt className="w-20 shrink-0 text-muted">Reason</dt><dd className="text-ink">{info.reason}</dd></div>
              {info.expiresAt && (
                <div className="flex gap-4 px-4 py-3"><dt className="w-20 shrink-0 text-muted">Ends</dt><dd className="text-ink tabular-nums">{new Date(info.expiresAt).toLocaleString()}</dd></div>
              )}
            </dl>

            {info.appealStatus !== "NONE" ? (
              <p className="mt-6 text-[15px] leading-relaxed text-ink-2">
                An appeal for this decision is already {info.appealStatus.toLowerCase()}.{info.decisionNote ? ` Note: ${info.decisionNote}` : ""}
              </p>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="appeal-text" className="label">Your appeal</label>
                  <textarea
                    id="appeal-text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={6}
                    required
                    minLength={10}
                    placeholder="Explain why this decision should be reconsidered."
                    className="field"
                  />
                  <p className="hint">At least 10 characters. Be specific about what you think was wrong.</p>
                </div>
                <button type="submit" className="btn-accent w-full btn-lg">Submit appeal</button>
              </form>
            )}
          </>
        )}

        <p className="mt-8 border-t border-line pt-5 text-[13px] text-muted">
          Questions? <Link href="/community-guidelines" className="text-ink underline decoration-line-strong underline-offset-4 hover:decoration-accent">Read the community guidelines</Link>.
        </p>
      </div>
    </main>
  );
}

export default function AppealPage() {
  return <Suspense fallback={null}><AppealForm /></Suspense>;
}
