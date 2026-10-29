import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documentation | RoleFlow",
  description: "How to use every part of RoleFlow: applying, tracking applications, running a community, and account settings.",
};

type Section = {
  id: string;
  title: string;
  intro?: string;
  steps?: string[];
  body?: string[];
  tips?: string[];
};

type Group = { title: string; sections: Section[] };

const groups: Group[] = [
  {
    title: "Getting started",
    sections: [
      {
        id: "sign-in",
        title: "Signing in",
        intro: "RoleFlow uses Discord to sign you in. There is no separate RoleFlow password.",
        steps: [
          "Click Login with Discord (in the top bar, or on any page that asks you to sign in).",
          "Approve the Discord permissions. RoleFlow uses your username, avatar, email, and server list.",
          "You return to RoleFlow signed in.",
        ],
        body: [
          "Signing out is in the account menu. It only signs you out on the device you're using.",
          "Two-factor sign-in is set up in Settings → Security & Active Sessions. When it's on, new devices must be confirmed.",
        ],
      },
      {
        id: "browse",
        title: "Browse and the Directory",
        intro: "Browse (the Directory) lists communities that have open positions.",
        steps: [
          "Open Browse from the top bar.",
          "Search by community name, role, studio, or tag. Press / to jump to search from anywhere on the page.",
          "Filter with Group member required and Roblox account, and sort with the Sort menu.",
          "Click a community to see its description, badges, and open positions.",
        ],
        body: ["If no communities match, the page says No communities match. Clear the filters to see everything."],
      },
      {
        id: "saved",
        title: "Saved openings",
        body: [
          "Save an opening you're interested in, and it's kept in Saved openings on My applications, under Saved for later.",
        ],
      },
    ],
  },
  {
    title: "Applying",
    sections: [
      {
        id: "apply",
        title: "Submitting an application",
        steps: [
          "Open a position from a community page. Read the description and the requirements.",
          "Click Connect with Discord to Apply if you're not signed in. Your Discord account is shown as the Authenticated Discord Applicant.",
          "Answer each question. Required questions are marked Required by community.",
          "Tick I confirm and agree on the consent question, if the community asks for it.",
          "Click Submit. The page confirms with Application Submitted!",
        ],
        body: [
          "Answers save as you type (Auto-Save Drafts), so a closed tab or a new device doesn't lose your work.",
          "Some openings show a Time Remaining countdown. When the deadline passes, the form closes and shows Applications Closed.",
          "If the form can't open, the page shows Unable to Open Form with the reason.",
        ],
        tips: [
          "Some communities require you to be in their Discord server or meet a Roblox requirement (group rank, game pass, or badge). The page tells you before you submit.",
          "Some communities check account age. A very new Discord account can be held or rejected automatically.",
        ],
      },
      {
        id: "question-types",
        title: "Question types you may see",
        body: [
          "Short Text: a single-line answer.",
          "Paragraph: a longer, multi-line answer.",
          "Select Dropdown: choose one of the listed options.",
          "Checkbox: an agreement or confirmation.",
          "URL Link: a web address, such as a Roblox profile or a GitHub page.",
          "Portfolio / Showcase Link: a link to your work. Some portfolios can show a YouTube video inline.",
          "File / Screenshot: a link to an image or file you host elsewhere.",
          "Roblox username: your exact Roblox username, where the community asks for it.",
        ],
      },
      {
        id: "track",
        title: "Tracking your applications",
        steps: [
          "Open My applications from the account menu.",
          "Each application shows its position, community, and current status.",
          "Your recent activity is listed under Your activity.",
        ],
        body: [
          "Statuses you may see: Pending, Under Review, Interview, Accepted, Rejected.",
          "If a community sends a note with its decision, the note appears on the application.",
          "After a rejection, the community may set a cooldown. The page shows when you can apply again.",
        ],
      },
      {
        id: "appeals",
        title: "Appealing a decision",
        body: [
          "If your account was restricted, the notice links to the Appeal a decision page. Explain why the decision should be reviewed in Your appeal, then click Submit appeal.",
          "You'll get an email when the appeal is decided.",
        ],
      },
      {
        id: "report",
        title: "Reporting a community or position",
        body: [
          "Use the Report button on a community or position page to report it. Reports go to RoleFlow staff, who review them.",
        ],
      },
    ],
  },
  {
    title: "Running a community",
    sections: [
      {
        id: "dashboard",
        title: "The community dashboard",
        intro: "Open the community dashboard from the account menu (it appears when you own or staff a community). Each community has six tabs.",
        body: [
          "Overview: open positions, applicant counts, and what needs attention.",
          "Applications: review applications for every opening.",
          "Openings & Form: create and edit openings and their question forms.",
          "Discord Bot: connect your bot and choose what it posts.",
          "Team: add staff and set their permissions.",
          "Settings: profile, access rules, notifications, and your plan.",
        ],
        tips: [
          "The header has Export CSV (download applications) and Public Page (opens your community page).",
        ],
      },
      {
        id: "create-community",
        title: "Creating a community",
        steps: [
          "Sign in, then open the community dashboard from the account menu.",
          "Create a community and connect the Discord server you own.",
          "Fill in the name, description, category, tags, banner, and icon.",
          "Pick a vanity address, for example roleflow.site/c/yourstudio.",
        ],
        body: ["Free accounts can own a limited number of communities. The plan section in Settings shows your limits."],
      },
      {
        id: "openings",
        title: "Openings and the form builder",
        intro: "Each opening is a position with its own application form. Work on them in the Openings & Form tab.",
        steps: [
          "Click Create New Opening and enter a title and description.",
          "Add questions with Add Question to Form. Choose a type (Short Text, Paragraph, Select Dropdown, Checkbox, URL Link, Portfolio / Showcase Link, or File / Screenshot), and mark it required if needed.",
          "Start from a template (Roblox Dev, Discord Staff, or Event Host) to save time.",
          "Import questions, or a whole opening, from CSV or JSON with Import Questions in Bulk or Import Entire Opening & Form.",
          "Use Edit Application Opening to change an existing opening.",
        ],
        body: [
          "Applications can be turned off for the whole community from the Settings tab, or for one opening from its settings.",
        ],
        tips: [
          "Keep old openings and close them rather than deleting them, so their applications stay in your records.",
        ],
      },
      {
        id: "review",
        title: "Reviewing applications",
        intro: "Open the Applications tab to see every application for your openings.",
        steps: [
          "Open an application to read the answers and any notes from other staff.",
          "Move it to the next status: Under Review, Interview, Accepted, or Rejected.",
          "Write a decision note. Notes can go to the applicant with the decision.",
          "Use Quick Accept and Quick Reject in Discord when your bot is connected.",
        ],
        body: [
          "Blind Voting: when it's on, individual votes stay hidden until the voting threshold (quorum) is reached. Staff can also give a star rating.",
          "Saved replies: store standard messages, such as a rejection with feedback, and reuse them.",
          "Auto-archive: decided applications can be moved to the archive after a number of days you set.",
          "Export CSV: download applications from the header.",
        ],
      },
      {
        id: "team",
        title: "Team and permissions",
        intro: "Add staff in the Team tab (Appoint Team Member). Each person gets one permission level.",
        body: [
          "View only: can read applications and notes, but can't decide.",
          "Full decision: can accept, reject, interview, and hold applications.",
          "Position editor: can edit openings and their forms, and can also make decisions.",
          "The owner can change team settings, the bot, and the custom domain. Staff can't.",
        ],
      },
      {
        id: "access",
        title: "Settings → Access & Gating",
        body: [
          "Require Discord server membership: applicants must already be in your server.",
          "Minimum account age: hold or block very new Discord accounts.",
          "Roblox checks: require a linked account, a group and rank, a game pass, or a badge.",
          "Rejection cooldown: how many days a rejected applicant must wait (0, 7, 14, or 30).",
          "Blind voting threshold: how many votes are needed before scores are shown.",
          "Blacklist: block a Discord user or Roblox username from applying to your community.",
        ],
      },
      {
        id: "profile",
        title: "Settings → Profile & Branding",
        body: [
          "Community profile: name, description, banner, icon, welcome message, website, and Discord invite. Website and invite links must start with https://.",
          "Portal theme: choose a preset (obsidian, cyberpunk, emerald, royal, or crimson), a layout (banner, minimal, or cards), and an accent color.",
          "Applicant count: show or hide how many people have applied.",
          "Discord widget: show your server's widget on your page.",
          "Announcement: a short notice at the top of your page, such as a deadline.",
          "Applications open: a switch that closes applications for the whole community.",
        ],
      },
      {
        id: "custom-domain",
        title: "Using your own domain",
        intro: "Run your community from an address you own, such as apply.yourstudio.com. This is in Settings → Profile & Branding, under the Custom Domain panel. Only the community owner can set it up.",
        steps: [
          "Type your domain in the box and click Connect domain. Enter just the domain, such as apply.yourstudio.com. RoleFlow's own domains can't be used.",
          "The panel shows two records. Add them at your DNS provider (for example Cloudflare, GoDaddy, or Namecheap).",
          "Record 1 (proves ownership): a TXT record at the Host shown, with the Value shown.",
          "Record 2 (points the domain at RoleFlow): a CNAME record for a subdomain, or an A record for a root domain. The panel shows which one, and the exact host and value.",
          "Wait a few minutes, then click Check verification. DNS changes can take a few minutes to 48 hours.",
          "When it says the domain is verified and live, open the domain in your browser.",
        ],
        body: [
          "On your domain, your portal, the apply pages for your openings, and your dashboard all work. Other RoleFlow pages redirect back to your community's home page.",
          "Signing in on your domain: click Log in. You're sent to RoleFlow to sign in with Discord, then brought back to the page you were on.",
          "To change the domain, enter a new one and click Connect domain. The old one stops working on your community.",
          "To stop using it, click Remove domain. Visitors go back to RoleFlow, and the domain can be connected to another community.",
        ],
        tips: [
          "If the panel says the TXT record isn't visible, check the Host and Value match the panel exactly, then wait and check again.",
          "If you use a root domain (example.com) and the panel asks for an A record, remove any existing A or CNAME record for the same host first. Two records for the same name will break it.",
          "Each domain can belong to one community at a time.",
        ],
      },
      {
        id: "notifications",
        title: "Settings → Notifications",
        body: [
          "Discord webhook for audit logs: paste a webhook URL from a Discord channel. RoleFlow posts a log there when staff make changes or decisions.",
        ],
      },
      {
        id: "plan",
        title: "Settings → Plan",
        body: [
          "Shows your community's subscription tier and what it includes.",
          "Plans control limits such as how many communities an account can own, how many openings a community can run, and access to features like custom domains. When licensing is turned off on the site, these features are free.",
        ],
      },
      {
        id: "bot",
        title: "Discord Bot tab",
        intro: "Connect a Discord bot so applications post to your server and interviews get their own channels. You can use RoleFlow's bot or your own.",
        steps: [
          "Open the Discord Bot tab.",
          "Choose the RoleFlow bot, or add your own bot's application ID, public key, and token.",
          "Pick a staff log channel. Optionally pick a staff ping role, reviewer role, and interview category.",
          "Run the test (Test embed) to check the connection, then save.",
        ],
        body: [
          "New application: the staff channel gets an embed with the applicant's details, a Review on RoleFlow button, and Quick Accept and Quick Reject buttons.",
          "Accepted applicants can be given a Discord role automatically, and applicants get a direct message on accept, reject, or interview.",
          "Interview: moving an application to Interview can create a private interview channel.",
        ],
        tips: [
          "Your own bot is only online while RoleFlow keeps its connection running. If it shows offline, check the token and the bot's permissions in the server.",
        ],
      },
      {
        id: "slash-commands",
        title: "Discord slash commands",
        intro: "Commands work in your server once the bot is connected.",
        body: [
          "Everyone: /help, /status (your applications), /openings (open positions), /apply (apply link), /portal (community links), /ping (bot check).",
          "Staff: /pending (oldest applications waiting), /stats (totals and approval rates), /lookup <user> (a member's applications, Roblox account, and account age).",
          "Decision makers: /accept <application_id> [note], /reject <application_id> [note], /interview <application_id>, /hold <application_id> [note]. Get the application ID from /pending or the staff alert.",
        ],
      },
    ],
  },
  {
    title: "Your account",
    sections: [
      {
        id: "account-settings",
        title: "Account settings",
        intro: "Open Settings from the account menu. It's organized into sections.",
        body: [
          "Profile: your public profile details, and Sync from Discord to refresh your name and avatar.",
          "Linked Accounts & Gaming Identities: your linked Roblox account.",
          "Security & Active Sessions: two-factor sign-in and the devices signed in to your account.",
          "Connected Apps & Integrations: services connected to your account.",
          "Activation Keys & Licenses: enter a license key to unlock a plan.",
          "Developer & API Access: your live secret API key, for building integrations. Keep it private.",
          "AI Controls: turn on or off automated low-effort screening and automated applicant summaries.",
          "10-Minute Support Mode: create a short code so RoleFlow support can help you while you're signed in.",
          "Danger Zone: delete your account. Type DELETE to confirm. This is permanent.",
        ],
      },
      {
        id: "billing",
        title: "Billing and licenses",
        body: [
          "The billing page covers licenses, billing, and refunds.",
          "To upgrade with a license key, enter it under Activation Keys & Licenses in Settings.",
        ],
      },
      {
        id: "feedback",
        title: "Feedback",
        body: [
          "Use the Feedback page to report bugs or suggest ideas. Pick an Area, give a short Summary, and describe the details.",
          "Your submissions show a Status so you can follow them.",
        ],
      },
    ],
  },
  {
    title: "Help",
    sections: [
      {
        id: "troubleshooting",
        title: "Troubleshooting",
        body: [
          "Can't sign in: allow pop-ups and cookies for roleflow.site, then try again. If Discord shows an error, try again in a few minutes.",
          "Application won't submit: check that every required question is answered and that the community's requirements are met. The page explains what's missing.",
          "Applications closed: the community has closed applications, or the deadline has passed. Check the community page for another opening.",
          "Bot isn't posting: check the bot is in the server with permission to post in the staff channel, and that the Discord Bot tab shows it as connected.",
          "Custom domain not working: check both records match the panel exactly, then click Check verification again after a few minutes.",
        ],
      },
      {
        id: "support",
        title: "Contact support",
        body: [
          "Email support@roleflow.site for account, billing, and community questions. Include the community name and what you were doing.",
          "Visit the Support page for more help. Support staff can start a 10-minute session with the code shown in Settings.",
        ],
      },
      {
        id: "policies",
        title: "Policies",
        body: [
          "Terms of Service, Privacy Policy, Acceptable Use, Community Guidelines, and Cookie Policy are linked in the site footer.",
        ],
      },
    ],
  },
];

function Block({ section }: { section: Section }) {
  return (
    <section id={section.id} className="scroll-mt-24 space-y-4">
      <h3 className="text-xl font-bold text-ink">{section.title}</h3>
      {section.intro && <p className="text-sm text-ink-2">{section.intro}</p>}
      {section.steps && (
        <ol className="list-decimal pl-5 space-y-2 text-sm text-ink-2">
          {section.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      )}
      {section.body?.map((p) => (
        <p key={p} className="text-sm text-ink-2 leading-relaxed">
          {p}
        </p>
      ))}
      {section.tips && (
        <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Tips</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-ink-2">
            {section.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <header className="mb-10 space-y-3">
        <h1 className="text-3xl font-bold text-ink">RoleFlow Documentation</h1>
        <p className="text-sm text-muted max-w-2xl">
          How to apply to communities, run one, and use each part of RoleFlow.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <nav aria-label="Documentation contents" className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {groups.map((g) => (
            <div key={g.title}>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">{g.title}</p>
              <ul className="space-y-1">
                {g.sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="block rounded-lg px-2 py-1 text-sm text-ink-2 hover:bg-sunk hover:text-ink">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-14 min-w-0">
          {groups.map((g) => (
            <div key={g.title} className="space-y-10">
              <h2 className="border-b border-line pb-2 text-sm font-bold uppercase tracking-wider text-accent">{g.title}</h2>
              {g.sections.map((s) => (
                <Block key={s.id} section={s} />
              ))}
            </div>
          ))}
          <p className="text-xs text-muted">
            Still stuck? <Link href="/support" className="text-accent hover:underline">Contact support</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
