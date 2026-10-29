# Custom Domains: Instruction Manual

A community can run from its own address, such as `apply.theirstudio.com`. The portal, applications, and the community dashboard all work on that domain. Sign-in is handled through roleflow.site.

This manual has two parts:

1. **For community owners:** how to connect a domain.
2. **For developers:** how it works and how to troubleshoot it.

---

## Part 1: Community owners

### What you need

- A domain you own, such as `apply.yourstudio.com` or `yourstudio.com`.
- Access to where that domain's DNS is managed (Cloudflare, GoDaddy, Namecheap, Google Domains, and so on).
- Owner access to your community on RoleFlow. Only the owner can connect or remove a domain.
- A paid plan, if licensing is enabled on the site. Otherwise custom domains are free.

### Step 1: Enter your domain

1. Open your community's **dashboard** and go to **Settings**.
2. Open the **Custom Domain** sub-tab. The panel is there.
3. Type the domain you want, without `https://` or a trailing slash. For example, `apply.yourstudio.com`.
4. Click **Connect domain**.

RoleFlow's own domains (`roleflow.site` and its subdomains) cannot be used. A domain can belong to only one community at a time.

### Step 2: Add the two DNS records

After connecting, the panel shows two records. Add both at your DNS provider.

**Record 1: proves you own the domain (TXT)**

| Field | Value |
|---|---|
| Type | `TXT` |
| Host / Name | the `Host` shown in the panel, for example `_roleflow-verify.apply.yourstudio.com` |
| Value | the `roleflow-verify=...` value shown in the panel |

Some DNS providers want only the part before your domain (`_roleflow-verify.apply`). Use whichever form your provider expects. Copy the value exactly.

**Record 2: points the domain at RoleFlow (routing)**

- **Subdomain** (`apply.yourstudio.com`): type `CNAME`, host `apply`, value `cname.vercel-dns.com`.
- **Root domain** (`yourstudio.com`): type `A`, host `@`, value `76.76.21.21`.

The panel shows the exact record for your domain. Use that.

If your domain already has an `A` or `CNAME` record for the same host, replace it. Two records for the same name will break routing.

### Step 3: Check verification

1. Wait a few minutes. DNS changes can take up to 48 hours to appear, though most finish within an hour.
2. Click **Check verification** in the panel.

You'll see one of these results:

- **"The TXT record isn't visible yet."** The TXT record hasn't spread yet, or it was entered wrong. Check the host and value, then wait and try again.
- **"Verified."** Ownership is confirmed. If the routing record is also correct, the domain is live.
- **"Ownership verified. Add the routing record."** The TXT record is correct, but the routing record isn't pointing at RoleFlow yet. Add it, wait, and check again.

### Step 4: Use your domain

Once live, visit your domain in a browser:

- `https://apply.yourstudio.com/` shows your community's portal.
- Applicants apply from the portal, the same way they do on roleflow.site.
- You open your dashboard at `https://apply.yourstudio.com/dashboard/<your-community-id>`. You can also use the dashboard link you already have.

### Signing in on your domain

Sign-in always goes through roleflow.site, because Discord only returns logins there. This is automatic:

1. Click **Log in** on your domain.
2. You're sent to roleflow.site and signed in with Discord as usual.
3. You're sent back to your domain, to the page you came from.

If you're already signed in on roleflow.site, Discord usually approves the login without asking again.

### What is and isn't on your domain

| Page | On your domain |
|---|---|
| Your portal (home page) | Yes |
| Apply pages for your positions | Yes |
| Your community dashboard | Yes |
| Other communities | No. They redirect to your home page. |
| Browse, Terms, Privacy, Settings | No. They redirect to your home page. |
| My Applications | No. Applicants track applications on roleflow.site. |

### Removing or changing your domain

- **Remove:** click **Remove domain** in the panel. Visitors will go back to roleflow.site, and the domain is free for another community.
- **Change:** enter a new domain and click **Connect domain**. The old one is released and must be verified again on the new one.

### Common problems

| Problem | Likely cause and fix |
|---|---|
| "The TXT record isn't visible yet" | Wrong host or value, or DNS hasn't propagated. Copy the record exactly and wait. |
| "That domain is already connected to another community" | Another community has it. Only its owner can remove it. |
| "Enter a domain you own" | You entered `roleflow.site`, a RoleFlow subdomain, an IP, or something that isn't a domain. |
| Domain goes to roleflow.site | The domain isn't verified yet, or routing isn't set. Finish both steps. |
| Browser shows a certificate or "not secure" error | HTTPS is issued automatically after routing is correct. Wait a few minutes after step 2. |
| Sign-in loops back to the login page | Make sure you're using the exact domain you connected, with no `www.` unless you connected `www.`. Try again in a private window. |
| "Custom domains are part of a paid plan" | Licensing is on for this site. Upgrade the community's plan. |

---

## Part 2: Developers

### How it fits together

| Piece | File | Job |
|---|---|---|
| Schema | `prisma/schema.prisma` | `customDomain`, `customDomainToken`, `customDomainVerified`, `customDomainVerifiedAt` on `Guild` |
| Domain logic | `src/lib/custom-domain.ts` | Validation, DNS TXT check, Vercel API calls, `publicGuildUrl`, `isPlatformHost` |
| Owner API | `src/app/api/guilds/[id]/domain/route.ts` | `GET` status, `POST` connect, `DELETE` remove. Owner only. Paid-plan gated. |
| Verify API | `src/app/api/guilds/[id]/domain/verify/route.ts` | `POST` checks the TXT record, then asks Vercel to verify routing |
| Host lookup | `src/app/api/custom-domain/resolve/route.ts` | Middleware uses it to check a host, its community, and whether a position belongs to it |
| Middleware | `src/middleware.ts` | Routes custom hosts, allows only community pages, and rewrites `/` to the portal |
| Portal page | `src/app/domain-portal/[domain]/page.tsx` | Renders the community portal for a host. Only responds when the Host header matches. |
| Sign-in bridge | `src/app/api/auth/bridge/route.ts` | Sets the custom domain's session from a short-lived token |
| Bridge tokens | `src/lib/custom-domain-auth.ts` | Signs and checks bridge tokens, sets the domain's cookie |
| Login / callback | `src/app/api/auth/login/route.ts`, `src/app/api/auth/callback/route.ts` | Route sign-in through roleflow.site and back to the domain |
| Dashboard UI | `src/components/CustomDomainPanel.tsx` | Connect, show DNS records, verify, remove. Lives on the Custom Domain sub-tab. |
| Site editor page | `src/app/dashboard/[guildId]/site/page.tsx` | Owner-only page at `/dashboard/<id>/site` |
| Site editor form | `src/components/dashboard/SiteConfigForm.tsx` | Look, copy, navigation, footer, search, and link fields, with live preview |
| Site options | `src/lib/site-config.ts` | Defaults, limits (header links 5, footer links 6), and validation for `Guild.siteConfig` |
| Site loader | `src/lib/site-data.ts` | Loads the community data and site options for the editor and the domain pages |
| Site chrome | `src/components/domain/DomainChrome.tsx` | Renders the header, footer, and the always-on "Powered by RoleFlow" line |
| Discord links | `src/app/api/discord/interactions/route.ts` | `/portal` and `/apply` link to the verified domain |

### Request flow on a custom domain

1. DNS sends `apply.example.com` to the Vercel project.
2. Middleware reads the Host header and calls `/api/custom-domain/resolve`. The result is cached for 60 seconds when verified, 10 seconds when not.
3. Unverified host → 308 redirect to `PLATFORM_ORIGIN`.
4. `/` → rewrite to `/domain-portal/<host>`.
5. `/api/*` → passes through to the normal API protections (rate limits, CSRF).
6. `/c/<slug or id>`, `/dashboard/<guildId>`, and `/apply/<positionId>` (position belongs to the community) → allowed.
7. Anything else → 308 redirect to `/` on the same domain.

### Sign-in flow

1. On the custom domain, `/api/auth/login` redirects to `roleflow.site/api/auth/login?return=<domain URL>`, using the Referer as the page to come back to.
2. Platform login validates `return` (https, verified domain, no port or credentials), then stores it in a 10-minute `rf_oauth_return` cookie.
3. Discord's callback is still `https://roleflow.site/api/auth/callback`, which is the only redirect registered with Discord.
4. After sign-in, the callback issues a bridge token: `userId|sessionVersion|host|exp|HMAC`, signed with `APP_SECRET` and valid for 120 seconds.
5. The browser opens `<domain>/api/auth/bridge?token=…&next=…`. The bridge checks the signature, expiry, and that the host matches, then sets a host-only session cookie.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `VERCEL_API_TOKEN` | For HTTPS and routing | Calls the Vercel Domains API |
| `VERCEL_PROJECT_ID` | For HTTPS and routing | The project the domains attach to |
| `VERCEL_TEAM_ID` | Team projects only | Scopes API calls to the team |
| `NEXT_PUBLIC_APP_URL` | Yes (already used) | Platform origin, default `https://roleflow.site` |
| `APP_SECRET` | Yes (already used) | Signs sessions and bridge tokens |

### Security notes

- **Ownership:** a domain is verified only when the TXT record contains the token from the database. The token is random per connection and changes whenever the domain changes.
- **Open redirects:** `return` targets are accepted only if they are https, have no port or credentials, and belong to a verified community domain. This is checked at login and again at callback.
- **Token scope:** bridge tokens are bound to one host and expire after 2 minutes. They are not single-use. A copied link can be used again within those 2 minutes.
- **Cookies:** the custom domain's session cookie has no `Domain` attribute, so it stays on that host.
- **Fail closed:** if the resolve lookup fails or times out, middleware treats the host as unverified.
- **Pages:** the portal route only responds when the request's Host header matches the domain in its URL, so `roleflow.site/domain-portal/...` returns 404.

### Known limits

- Logging out from a custom domain returns the user to roleflow.site.
- Email links and Discord messages to applicants point to roleflow.site, except for `/portal` and `/apply` commands.
- Applicant "My Applications" is not available on custom domains.
- Root-domain detection counts domains with two labels as roots. Domains like `example.co.uk` are treated as subdomains and may need the CNAME shown in the panel instead of the A record.
- Vercel's API paths used here are `/v10/projects/{id}/domains`, `/v9/projects/{id}/domains/{domain}/verify`, and `/v6/domains/{domain}/config`. Check them against Vercel's current API reference if a call fails.

---

## Customizing your domain site (owners)

Once a domain is verified, you can change how your site looks, what it says, and what the header and footer show. Open the site editor in either of two ways:

- **Settings → Custom Domain**, then click **Customize your site →**.
- **Settings → Portal Look**, then click **Customize Full Site →**.
- Or go straight to `/dashboard/<your-community-id>/site`.

The site editor needs manage access to the community. It has these sections:

- **Look:** accent color, the sign-in button label (up to 30 characters, shown to visitors who are not signed in), opening layout (Banner, Minimal, or Cards), header style (Accent bar and logo, or Plain), and toggles for the header, reviews, and applicant count. The accent color and opening layout are the same settings as on the **Portal Look** sub-tab.
- **Copy:** an announcement (up to 280 characters), a welcome message (up to 1,000 characters), and an about section (up to 1,000 characters).
- **Navigation:** up to 5 header links. Each link needs a label of up to 40 characters and an `https://` address. Links appear in the header on larger screens. Use the arrows to change their order.
- **Footer:** show or hide the footer, add footer text (up to 160 characters), and add up to 6 footer links.
- **Search and sharing:** a page title (up to 70 characters) and a page description (up to 200 characters), used by search engines and link previews. Leave them empty to use your community name and description.
- **Links and images:** logo, banner, website, and Discord invite. Each must start with `https://`. Leave a field empty to remove it.

A live preview updates as you type. Click **Save changes** to publish. The bar above the button shows **You have unsaved changes** until everything is stored, and then **All changes saved**.

**"Powered by RoleFlow" always stays.** It appears at the bottom of every custom domain, even when you hide the footer. It cannot be turned off.

## Bot console (owners)

**Dashboard → Discord Bot** shows a live console for your bot. Lines are tagged `[i]` (info), `[✓]` (connected or resumed), `[!]` (warning), and `[✗]` (error). The console refreshes every 3 seconds. Use **Pause** to stop updates, **Clear** to empty the view, and the **warnings & errors** checkbox to show only problems. Lines are kept for 7 days and then removed automatically. New lines appear only when the bot writes them, so the console stops updating while the bot is offline.

Deployment note: the `BotLog` table and the `Guild.siteConfig` column are part of the current schema. Run `npm run db:push` once after deploying if your database does not have them yet. This change adds no new schema.
