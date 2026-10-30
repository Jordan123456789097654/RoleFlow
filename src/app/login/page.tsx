import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in | RoleFlow",
  description: "Choose how to sign in to RoleFlow.",
};

const options = [
  {
    href: "/api/auth/login",
    title: "Log in with Discord",
    desc: "Signs you in with your Discord account. RoleFlow uses your email to send application updates and sign-in alerts.",
    cta: "Continue with Discord",
    primary: true,
  },
  {
    href: "/api/auth/login?noemail=1",
    title: "Log in without email",
    desc: "Signs you in with Discord but does not ask for your email. You can still apply and track applications. Email updates stay off until you add an address in Settings.",
    cta: "Continue without email",
    primary: false,
  },
];

export default function LoginPage() {
  return (
    <div className="page-wrap py-16 sm:py-20 max-w-2xl">
      <p className="eyebrow mb-3">Log in</p>
      <h1 className="display-md">How would you like to sign in?</h1>
      <p className="mt-3 text-sm text-muted">Pick one. You can change what RoleFlow can see at any time in Settings.</p>

      <div className="mt-10 grid gap-4">
        {options.map((o) => (
          <a
            key={o.href}
            href={o.href}
            className="glass-panel block rounded-2xl border border-line p-6 transition-colors hover:border-accent"
          >
            <p className="text-base font-semibold text-ink">{o.title}</p>
            <p className="mt-1 text-sm text-muted">{o.desc}</p>
            <span className={`mt-4 inline-block rounded-xl px-4 py-2 text-xs font-semibold ${o.primary ? "bg-purple-600 text-white" : "bg-sunk text-ink-2 border border-line"}`}>
              {o.cta}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
