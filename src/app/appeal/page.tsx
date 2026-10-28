"use client";

import { Suspense, useEffect, useState } from "react";
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

  const card = "w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.03] p-8";
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08090d] p-6 text-slate-200">
      <div className={card}>
        <h1 className="mb-2 text-xl font-bold text-white">Appeal a decision</h1>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        {done && <p className="text-sm text-emerald-300">Your appeal was submitted. You will be emailed when it is reviewed.</p>}
        {info && !done && (
          <>
            <div className="mb-4 space-y-1 rounded-lg bg-black/30 p-4 text-sm">
              <div><span className="text-slate-500">Action:</span> {info.action}</div>
              <div><span className="text-slate-500">Reason:</span> {info.reason}</div>
              {info.expiresAt && <div><span className="text-slate-500">Ends:</span> {new Date(info.expiresAt).toLocaleString()}</div>}
            </div>
            {info.appealStatus !== "NONE" ? (
              <p className="text-sm text-slate-300">An appeal for this decision is already {info.appealStatus.toLowerCase()}.{info.decisionNote ? ` Note: ${info.decisionNote}` : ""}</p>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} required minLength={10} placeholder="Explain why this decision should be reconsidered." className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-purple-500" />
                <button className="w-full rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-500">Submit appeal</button>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function AppealPage() {
  return <Suspense fallback={null}><AppealForm /></Suspense>;
}
