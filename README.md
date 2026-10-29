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
