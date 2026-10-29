# RoleFlow — The Modern Application Management Platform & Discord Bot

**Official Domain:** [roleflow.site](https://roleflow.site)  
Designed for Discord communities, Roblox development studios, gaming clans, and creator networks.

---

## 🌟 Features

1. **Aesthetic & Theme**:
   - Deep obsidian dark mode (`#08090d`) with subtle grid backdrop and glowing radial violet accents (`#8b5cf6`).
   - Glowing title: *"The new way of managing **applications**"*.
   - Dynamic opening counters, search bar with `/` keyboard trigger, and glowing CTA buttons.
   - Community cards for **Meridian Studios**, **Lucid Lighting**, and **zz_removed_test** with banners, logos, tags, and open counts.

2. **White-label Custom Bot System (Toggleable)**:
   - Community admins can toggle between the global **RoleFlow Bot** or provide their own **Discord Bot Token**.
   - Embeds, automated role grants, applicant DMs, and interview tickets are dispatched under the community's own custom bot avatar and name.

3. **Roblox & Gaming Integrations (Toggleable)**:
   - Roblox account linking and verification (avatar thumbnail, username, account age).
   - Dedicated portfolio/link fields with live previews.

4. **Automated Discord Workflow**:
   - **Slash Commands**: `/setup`, `/openings`, `/apply`, `/status`.
   - **Hybrid Staff Channel Embeds**: Alert sent to staff channel with applicant details, a *"Review on RoleFlow"* web button, and instant **Quick Accept** / **Quick Reject** buttons inside Discord!
   - **Automated Role Grants**: Bot automatically assigns configured Discord roles upon acceptance.
   - **Automated Interview Channels**: Creates private `#interview-username` threads/tickets in Discord when moved to the `INTERVIEW` stage.
   - **Applicant DMs**: Direct messages sent upon acceptance, rejection, or interview invitation.

5. **Staff Review & Anti-Burnout Tools**:
   - Kanban / Split-view dashboard with status transitions (`PENDING` -> `UNDER_REVIEW` -> `INTERVIEW` -> `ACCEPTED` / `REJECTED`).
   - Staff blind voting (prevents bias by hiding votes until submitted) and star ratings.
   - Rejection cooldowns (configurable days: 0, 7, 14, 30 days) to prevent spam.
   - Community Blacklist system (blocks Discord IDs or Roblox usernames).
   - 1-Click Form Templates (Roblox Dev, Discord Staff, Event Host).

6. **Applicant Experience**:
   - **Auto-Save Drafts**: Answers are saved to your account as you type, so a closed tab or a new device doesn't lose them.
   - Community vanity URLs (e.g. `/c/meridian`, `/c/lucid`).
   - "My Applications" tracking hub.

7. **Site Admin Super-Console**:
   - Award and revoke **Verified Badges** (`OFFICIAL`, `PARTNER`, etc.) to communities.
   - Overview of global metrics.

8. **Legal & Compliance Suite**:
   - Full **Terms of Service** (`/terms`)
   - Comprehensive **Privacy Policy** (`/privacy`)
   - **Acceptable Use Policy** (`/acceptable-use`)

---

## 🚀 Getting Started

### 1. Start the Web Platform
```bash
cd roleflow
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 2. Start the Discord Bot (Optional)
To connect the bot to live Discord:
1. Open `.env` and fill in:
   ```env
   DISCORD_CLIENT_ID="your_bot_client_id"
   DISCORD_BOT_TOKEN="your_bot_token"
   ```
2. Run the bot:
   ```bash
   npm run bot
   ```
   Or run both web and bot concurrently:
   ```bash
   npm run dev:all
   ```

*(Note: Each community connects its own Discord bot in Bot Settings. There is no platform-wide bot. The bot process must run continuously on a host that is not serverless, such as Railway, Render, or Fly.io.)*

---

## Scheduled jobs

- **Auto-archive**: call `GET /api/cron/archive` daily with the header `Authorization: Bearer $CRON_SECRET`. It archives decided applications for communities that set an auto-archive window (Dashboard > Scheduling & Automation). Archived applications are hidden from the review board; applicants still see them.

## After pulling this version

```bash
npx prisma db push && npx prisma generate
npm run discord:register   # publishes the new /lookup command
```

## Staff module: Phase 1 (roster and quotas)

- New tables: `QuotaRule` (weekly minutes per Roblox rank) and `Shift` (game-session records, populated in Phase 2).
- New `GuildStaff` fields: `robloxUserId`, `robloxRankId`.
- API: `GET /api/guilds/[id]/roster`, `GET|PUT /api/guilds/[id]/quotas`, `PUT /api/guilds/[id]/staff/[userId]/roblox`.
- Page: `/dashboard/[guildId]/staff`.

After pulling: `npx prisma db push && npx prisma generate`.

## Staff module: Phase 2 (game ingestion)

- `POST /api/guilds/[id]/game/event`: join, heartbeat, and leave events from a Roblox server. Requires `Authorization: Bearer <game secret>` and a `sentAt` timestamp within 2 minutes. Only Roblox accounts linked to a staff member are recorded.
- `GET|POST /api/guilds/[id]/game/secret`: check whether a secret exists, or generate one (shown once; generating a new one invalidates the old).
- Shifts that stop sending heartbeats for 3 minutes are closed at their last heartbeat and marked `TIMED_OUT`.
- `roblox/RoleFlowStaffTracker.luau`: game-side script. Paste it into a ModuleScript in ServerScriptService and fill in CONFIG.

After pulling: `npx prisma db push && npx prisma generate`.

## Staff module: Phase 3 (quotas, linking, reports)

- Quota editor and Roblox linking on `/dashboard/[guildId]/staff` (owners and site admins only).
- `GET /api/guilds/[id]/staff/[userId]/history?weeks=8`: weekly minutes for one staff member.
- Cron: `GET /api/cron/staff-shifts` (run every 5 minutes) closes shifts with missed heartbeats.
- Cron: `GET /api/cron/staff-report` (run daily; sends only on Mondays UTC) emails each owner last week's under-quota and unlinked staff. Each community gets one report per week.

Both cron routes need `Authorization: Bearer $CRON_SECRET`.

After pulling: `npx prisma db push && npx prisma generate`.

## Staff module: Phase 4 (announcements, manual time, conduct)

- `/dashboard/[guildId]/compliance`: post announcements, request and review manual time, log infractions.
- Hard-gate announcements block the staff roster page until acknowledged. The gate component can be added to other dashboard pages.
- Acknowledgments store the user ID and time only. IP addresses are not recorded.
- Strikes: 90-day rolling window. 3 points recommends a warning, 6 points recommends a demotion review. Nothing is applied automatically.
- Approving a manual log creates a closed shift at the requested time.
- Evidence must be https links. Files are not uploaded to RoleFlow yet.

Schema fix: `Guild` now has back-relations for `QuotaRule`, `Shift`, and the new models. Without them Prisma fails validation.

After pulling: `npx prisma db push && npx prisma generate`.

## Staff module: Phase 5 (live servers and broadcasts)

- `/dashboard/[guildId]/live`: live servers (reported in the last 3 minutes) with player counts, ping, uptime, and staff on each server. Owners can send a notice.
- Game servers report status every 30 seconds to `POST /api/guilds/[id]/game/server`.
- Broadcasts: owners only (`POST /api/guilds/[id]/broadcasts`). Requires `confirm: true`, 200 characters of plain text, a 10-minute cooldown, and at least one live server. Each send is recorded in the audit log.
- Game servers poll `GET /api/guilds/[id]/game/broadcasts` and confirm receipt at `POST .../receipt`. The live page shows how many servers received each notice.
- Broadcast text is shown as plain text (RichText off) in the game.

After pulling: `npx prisma db push && npx prisma generate`.

## Staff: required Roblox link, manual staff, monitored-role popup

- Every staff member must have a Roblox account linked. The link endpoint checks that the Roblox user exists.
- `POST /api/guilds/[id]/staff/manual` adds staff by hand, for communities without a Roblox group. Roblox ID is required; Discord ID is optional.
- Rank 0 means manual staff (no Roblox group). Quotas can be set for it.
- The monitored-roles popup also opens when settings are saved with a new group ID.
