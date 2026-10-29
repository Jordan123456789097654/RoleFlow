"use client";

import { useState } from "react";

const card = "rounded-2xl border border-line bg-surface p-5";
const input = "w-full rounded-lg border border-line bg-sunk px-3 py-2 text-sm text-ink outline-none focus:border-accent";

export default function AccountsPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [account, setAccount] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);

  const search = async () => {
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query.trim())}`);
    if (res.ok) setResults(await res.json());
  };

  const open = async (id: string) => {
    const res = await fetch(`/api/admin/accounts/${id}`);
    if (res.ok) setAccount(await res.json());
  };

  const revoke = async () => {
    if (!account || !confirm(`End every active session for ${account.user.username}?`)) return;
    const res = await fetch(`/api/admin/accounts/${account.user.id}`, { method: "POST" });
    const data = await res.json();
    setMessage(res.ok ? "All sessions ended. They will need to sign in again." : data.error);
    if (res.ok) open(account.user.id);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <section className={`${card} space-y-3 lg:col-span-1`}>
        <h3 className="text-sm font-bold text-ink">Find an account</h3>
        <div className="flex gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Name, Discord ID, or Roblox name" className={input} />
          <button onClick={search} className="shrink-0 rounded-lg bg-purple-600 px-3 text-xs font-semibold text-white hover:bg-purple-500">Search</button>
        </div>
        <ul className="max-h-96 divide-y divide-line overflow-y-auto">
          {results.map((u) => (
            <li key={u.id}>
              <button onClick={() => open(u.id)} className="flex w-full items-center justify-between py-2 text-left text-xs text-ink-2 hover:text-ink">
                <span className="truncate">{u.username}</span>
                <span className="font-mono text-[10px] text-faint">{u.id}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${card} space-y-5 lg:col-span-2`}>
        {!account ? (
          <p className="text-xs text-faint">Select an account to see its communities, applications, devices, punishments, and audit history.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-base font-bold text-ink">{account.user.username}</div>
                <div className="font-mono text-[11px] text-faint">{account.user.id} · {account.user.email || "no email"} · {account.user.siteRole || "USER"}</div>
              </div>
              <button onClick={revoke} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500">End all sessions</button>
            </div>
            {message && <p className="text-xs text-moss">{message}</p>}

            <Block title={`Communities owned (${account.guilds.length})`}>
              {account.guilds.map((g: any) => <Row key={g.id} left={g.name} right={g.isPaused ? "PAUSED" : new Date(g.createdAt).toLocaleDateString()} />)}
            </Block>
            <Block title={`Recent applications (${account.applications.length})`}>
              {account.applications.map((a: any) => <Row key={a.id} left={`${a.position.title} · ${a.position.guild.name}`} right={a.status} />)}
            </Block>
            <Block title={`Login devices (${account.devices.length})`}>
              {account.devices.map((d: any) => <Row key={d.id} left={(d.userAgent || "unknown").slice(0, 80)} right={`seen ${new Date(d.lastSeenAt).toLocaleDateString()}`} />)}
            </Block>
            <Block title={`Punishments (${account.punishments.length})`}>
              {account.punishments.map((p: any) => <Row key={p.id} left={`${p.action} — ${p.reason}`} right={p.liftedAt ? "lifted" : p.appealStatus !== "NONE" ? `appeal ${p.appealStatus}` : "active"} />)}
            </Block>
            <Block title="Audit entries">
              {account.auditEntries.map((e: any) => <Row key={e.id} left={e.action} right={new Date(e.createdAt).toLocaleString()} />)}
            </Block>
          </>
        )}
      </section>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">{title}</h4>
      <ul className="divide-y divide-line">{children}</ul>
    </div>
  );
}

function Row({ left, right }: { left: string; right: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-1.5 text-xs">
      <span className="truncate text-ink-2">{left}</span>
      <span className="shrink-0 text-faint">{right}</span>
    </li>
  );
}
