import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
    title: "Custom domains",
    sections: [
      {
        id: "cd-overview",
        title: "What custom domains do",
        intro: "A custom domain lets your community run from an address you own, such as apply.yourstudio.com, instead of roleflow.site/c/your-community. Applicants and staff use your address for everything RoleFlow does for your community.",
        body: [
          "Once connected, your domain serves your community's portal at its home page, the apply pages for your openings, and your community dashboard. Applicants can read your portal, apply, and track their applications from your domain.",
          "A domain can belong to one community at a time. Connecting it does not change your community's RoleFlow address, which still works.",
          "Custom domains are set up by the community owner from Settings → Profile & Branding. Team members can use the domain but cannot change it.",
          "Plan requirement: where licensing is turned on, custom domains are part of a paid plan. Where licensing is off, they are free for every community.",
        ],
      },
      {
        id: "cd-before",
        title: "Before you start",
        body: [
          "You need a domain you own. Examples: apply.yourstudio.com (a subdomain) or yourstudio.com (a root domain).",
          "You need access to the place where the domain's DNS is managed. This is usually your domain registrar or DNS host, such as Cloudflare, GoDaddy, Namecheap, Google Domains, Squarespace, or your hosting control panel.",
          "You need to be the owner of the community on RoleFlow. Staff with decision permission cannot connect a domain.",
          "RoleFlow's own domains cannot be used. That includes roleflow.site, www.roleflow.site, and any subdomain of roleflow.site.",
          "Recommendation: use a subdomain such as apply.yourstudio.com. Subdomains are simpler to set up and leave your main website and email on the root domain untouched.",
        ],
        tips: [
          "Decide before you start whether the domain will be a subdomain or a root domain. The records you add are different for each (see Step 3).",
          "Check that nothing else already uses the name you want. If the host already has a website or an email record, adding a RoleFlow record for it can break that service.",
        ],
      },
      {
        id: "cd-connect",
        title: "Step 1: Connect the domain",
        steps: [
          "Open your community dashboard and go to the Settings tab.",
          "Open the Profile & Branding section.",
          "Find the Custom Domain panel.",
          "Type the domain, without https:// and without a trailing slash, such as apply.yourstudio.com.",
          "Click Connect domain.",
          "RoleFlow saves the domain and shows the two DNS records you need to add. The domain is not live yet.",
        ],
        body: [
          "If you see \"Enter a domain you own\", the name is not valid, or it belongs to RoleFlow. Check for typos, spaces, and extra characters.",
          "If you see \"That domain is already connected to another community\", another community is using it. Only that community's owner can remove it.",
          "If you see \"Custom domains are part of a paid plan\", the community needs a paid plan while licensing is turned on.",
        ],
      },
      {
        id: "cd-txt",
        title: "Step 2: Add the TXT record (proves ownership)",
        intro: "The TXT record proves that you control the domain. Nobody else can connect your domain without access to its DNS.",
        steps: [
          "Open your DNS provider and go to the page for managing DNS records for your domain.",
          "Click Add record and choose TXT.",
          "Enter the Host exactly as shown in the panel. The panel shows the full name, for example _roleflow-verify.apply.yourstudio.com.",
          "Enter the Value exactly as shown in the panel. It starts with roleflow-verify= and ends with a long random code.",
          "Save the record. Leave the TTL on automatic or the default.",
        ],
        body: [
          "Some DNS providers only want the part before your domain. For apply.yourstudio.com, enter _roleflow-verify.apply as the host. Cloudflare and some others add the domain for you, so enter what they expect. If the record shows as _roleflow-verify.apply.yourstudio.com.yourstudio.com, the host was entered twice.",
          "Do not add quotation marks around the value. Copy it exactly, including the = sign.",
          "Keep this record in place after verification. Removing it later can cause verification to fail on a future check.",
        ],
        tips: [
          "Copy the value by selecting the text in the panel rather than retyping it. One wrong character will fail verification.",
        ],
      },
      {
        id: "cd-routing",
        title: "Step 3: Add the routing record (points your domain at RoleFlow)",
        intro: "The routing record tells the internet where to send visitors to your domain. The panel shows which type to use.",
        body: [
          "For a subdomain such as apply.yourstudio.com: add a CNAME record. The host is the part before your domain (here, apply). The value is cname.vercel-dns.com.",
          "For a root domain such as yourstudio.com: add an A record. The host is @ (sometimes written as the root or blank). The value is 76.76.21.21.",
          "If your domain already has an A or CNAME record for the same host, replace it. Two records for the same name will prevent the domain from working.",
          "Cloudflare users: set the record's proxy status to DNS only (grey cloud). The orange proxy cloud stops RoleFlow from issuing the HTTPS certificate.",
          "If you want both www and the bare domain to work, add the www record separately. RoleFlow connects the exact domain you entered.",
        ],
        tips: [
          "The panel always shows the exact host and value for your domain. If the values here and in the panel differ, follow the panel.",
        ],
      },
      {
        id: "cd-verify",
        title: "Step 4: Check verification",
        steps: [
          "Wait a few minutes after saving the records. Most changes appear within an hour.",
          "Open the Custom Domain panel and click Check verification.",
          "Read the message RoleFlow shows and follow its advice.",
          "When the message says the domain is verified and live, open the domain in a browser.",
        ],
        body: [
          "The panel shows one of three states. Waiting for DNS verification means the TXT record is not visible yet. Ownership verified means the TXT record is correct, but the routing record is not pointing at RoleFlow yet. Live means both records are correct and the domain works.",
          "\"The TXT record isn't visible yet\" usually means the record was entered incorrectly or has not spread yet. Check the host and value, then wait and try again. DNS can take up to 48 hours, although most changes finish much sooner.",
          "The HTTPS certificate is issued after the routing record is correct. Right after you fix the routing, the browser may show a certificate warning for a few minutes. This clears on its own.",
          "Click Recheck at any time, even after the domain is live, to confirm it still works.",
        ],
      },
      {
        id: "cd-using",
        title: "Using your domain",
        body: [
          "Your home page (https://apply.yourstudio.com/) shows your community's portal, with your banner, description, announcement, and open positions.",
          "Apply pages for your openings work on your domain. Applicants fill in the same form they would on roleflow.site.",
          "Your dashboard is at https://apply.yourstudio.com/dashboard/ followed by your community's ID. You can also open it from the dashboard link you already use.",
          "Your community page works on the domain as well, under /c/ followed by your vanity address.",
          "Any other RoleFlow page, such as Browse, Terms, Privacy, or another community, sends the visitor back to your community's home page. Visitors cannot browse other communities from your domain.",
          "My applications is not available on a community domain. Applicants track their applications on roleflow.site.",
        ],
      },
      {
        id: "cd-signin",
        title: "Signing in on your domain",
        intro: "Discord only sends sign-in back to roleflow.site, so RoleFlow handles sign-in in two steps. You won't need to do anything special.",
        steps: [
          "On your domain, click Log in (or Connect with Discord to Apply on an apply page).",
          "You're taken to roleflow.site, where you sign in with Discord as usual.",
          "RoleFlow sends you back to your domain, to the page you were on, already signed in.",
        ],
        body: [
          "If you're already signed in to roleflow.site and approved RoleFlow on Discord, the sign-in often finishes without asking again.",
          "Signing in on roleflow.site does not sign you in on your domain, and signing in on your domain does not sign you in on roleflow.site. Each domain keeps its own session.",
          "Logging out on your domain signs you out there and takes you to roleflow.site. Log in again on your domain when you return.",
          "Sign-in links are short-lived. If a link expires while you're on the page, go back and click Log in again.",
        ],
        tips: [
          "If the sign-in loops back to the login page, make sure you're using the exact domain you connected, and try a private window to clear old sessions.",
        ],
      },
      {
        id: "cd-discord",
        title: "Discord bot and emails",
        body: [
          "Once your domain is verified, the Discord commands /portal and /apply give your domain's address.",
          "The Review on RoleFlow button on staff alerts opens the application on roleflow.site, where your staff already sign in.",
          "Email notifications link to roleflow.site, not to your domain.",
          "Changes to the domain take effect within a few minutes. Discord messages that were already posted keep their original links.",
        ],
      },
      {
        id: "cd-change",
        title: "Changing or removing your domain",
        body: [
          "To change your domain, enter the new domain in the Custom Domain panel and click Connect domain. The old domain stops working for your community, and the new one must be verified from the beginning.",
          "Remove the old TXT and routing records from your DNS provider once the new domain is live. Leaving them in place does not break anything, but they are no longer needed.",
          "To remove the domain entirely, click Remove domain in the panel. Visitors to the old address go back to roleflow.site, and the domain is released so another community can connect it.",
          "Removing the domain does not delete your community, openings, or applications.",
        ],
        tips: [
          "Wait until the new domain shows Live before removing the old DNS records. This avoids a gap in service.",
        ],
      },
      {
        id: "cd-troubleshooting",
        title: "Troubleshooting custom domains",
        body: [
          "The TXT record isn't visible. Check the host and value match the panel exactly, with no extra spaces or quotation marks. Some providers add your domain automatically, so the host may need to be only the first part. Wait 10 to 15 minutes, then check again.",
          "Verified, but the domain doesn't open. The routing record is missing or wrong. Confirm the type (CNAME for subdomains, A for root domains), the host, and the value. For Cloudflare, use DNS only, not proxied.",
          "Certificate or \"not secure\" warning. The HTTPS certificate is still being issued. This takes a few minutes after the routing record is correct. If it continues for more than an hour, recheck the routing record.",
          "The domain goes to roleflow.site. It is not verified yet, or the routing record is not in place. Finish the TXT and routing steps, then check verification.",
          "Page not found on the domain. The page may be part of another community or a RoleFlow page that is not available on community domains. Go to your home page.",
          "\"Already connected to another community\". Another community is using the domain. Only that community's owner can remove it.",
          "Your domain has a www version. The domain you connected is the only one RoleFlow serves. Add a separate www record if you need it, and connect it as its own domain only if you want it to work the same way.",
          "The bot links still go to roleflow.site. Discord messages that were already posted keep their old links. New commands like /portal use the custom domain after verification.",
        ],
      },
      {
        id: "cd-security",
        title: "Security and privacy",
        body: [
          "Ownership: the TXT record is the only proof RoleFlow accepts. We check it for the token shown in your panel. Nobody can verify your domain without adding that record to its DNS.",
          "Tokens are random for each connection. Changing the domain issues a new token.",
          "RoleFlow does not ask for your DNS provider login or API keys.",
          "A domain can only be connected to one community at a time, and RoleFlow never serves a domain that has not been verified.",
          "Sign-in tokens used to move you from roleflow.site to your domain are short-lived and tied to that one domain.",
        ],
      },
      {
        id: "cd-faq",
        title: "Frequently asked questions",
        body: [
          "Can I use a domain I bought from another company? Yes, any domain you control can be used, wherever it was registered.",
          "Can I use a free domain? Yes, as long as you control its DNS records. Some free hosts do not allow the records RoleFlow needs.",
          "Do applicants need an account on my domain? No. They sign in with Discord, which takes them to roleflow.site and back to your domain.",
          "Will my existing applicants and openings move? Yes. Your community's data is the same. Only the address changes.",
          "Can I have two domains for one community? One custom domain per community is supported. Your roleflow.site address keeps working alongside it.",
          "How long does it take? Usually a few minutes after you save the records. DNS can take up to 48 hours in rare cases.",
        ],
      },
    ],
  },
  {
    title: "Partnerships",
    sections: [
      {
        id: "pt-what",
        title: "What a partnership is",
        body: [
          "A partnership is an official connection between your community and RoleFlow. Partner communities get the Partner badge, which appears on their community card and page.",
          "Partner communities can be featured on the RoleFlow home page, where new applicants are likely to see them.",
          "A partnership is granted by the RoleFlow founder after review. It is not something you can switch on yourself.",
        ],
      },
      {
        id: "pt-apply",
        title: "Applying for a partnership",
        steps: [
          "Open your community dashboard and go to the Settings tab.",
          "Open the Plan section. The Partnership card is at the top.",
          "Write a message about your community, at least 80 characters. Describe what the community does, how active it is, and why it should be a partner.",
          "Add your website if you have one. It must start with https://.",
          "Click Apply for partnership.",
        ],
        body: [
          "Only the community owner can apply. Staff members can see the status but cannot submit a request.",
          "You can have one request under review at a time. Once a request is decided, you can apply again.",
          "A community that is already a partner will see that the partnership is active, and no new request is needed.",
        ],
        tips: [
          "A clear, specific message is easier to review. Include your community's focus, how many members and open positions it has, and anything that shows it is well run.",
        ],
      },
      {
        id: "pt-review",
        title: "How applications are reviewed",
        body: [
          "The RoleFlow founder reviews every partnership application in the founder panel. Open the Admin console and choose the Partnerships tab. Only the founder can approve or reject.",
          "The founder reads your message and website, and may add a note to the owner with the decision.",
          "Your Partnership card shows the status: Under review, Approved, or Not approved, along with any note.",
        ],
      },
      {
        id: "pt-outcome",
        title: "After a decision",
        body: [
          "Approved: your community receives the Partner badge straight away. The badge is shown on your community card and page, and your community can be featured on the home page.",
          "Not approved: the note explains the decision where the founder left one. You can apply again later, once you've addressed the points raised.",
          "Badges are managed by RoleFlow. If a partnership needs to be changed later, contact support@roleflow.site.",
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

function Block({ section, index }: { section: Section; index: number }) {
  return (
    <section id={section.id} className="scroll-mt-24 space-y-4">
      <h3 className="display-md">
        <span className="mr-2 font-mono text-[13px] text-faint">{index}.</span>
        {section.title}
      </h3>
      {section.intro && <p className="text-[15px] leading-relaxed text-ink-2">{section.intro}</p>}
      {section.steps && (
        <ol className="list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-ink-2 marker:text-faint">
          {section.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      )}
      {section.body?.map((p) => (
        <p key={p} className="text-[15px] leading-relaxed text-ink-2">
          {p}
        </p>
      ))}
      {section.tips && (
        <div className="card space-y-2 p-5">
          <p className="eyebrow">Tips</p>
          <ul className="list-disc space-y-1.5 pl-5 text-[14px] leading-relaxed text-ink-2 marker:text-faint">
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
  let counter = 0;
  return (
    <div className="page-wrap py-12 sm:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        RoleFlow home
      </Link>

      <div className="mx-auto mt-10 grid max-w-5xl gap-12 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav aria-label="Documentation contents" className="space-y-6">
            {groups.map((g) => (
              <div key={g.title}>
                <p className="eyebrow mb-3">{g.title}</p>
                <ol className="space-y-2 text-[13px]">
                  {g.sections.map((s) => {
                    counter += 1;
                    return (
                      <li key={s.id}>
                        <a href={`#${s.id}`} className="text-ink-2 hover:text-accent">
                          <span className="mr-2 font-mono text-faint">{String(counter).padStart(2, "0")}</span>
                          {s.title}
                        </a>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </nav>
        </aside>

        <article className="min-w-0">
          <header className="border-b border-line pb-8">
            <p className="eyebrow mb-4">Documentation</p>
            <h1 className="display-lg">RoleFlow Documentation</h1>
            <p className="mt-4 text-[17px] text-ink-2">
              How to apply to communities, run one, and use each part of RoleFlow.
            </p>
          </header>

          <div className="space-y-16 pt-8">
            {groups.map((g) => {
              const start = groups.slice(0, groups.indexOf(g)).reduce((n, x) => n + x.sections.length, 0);
              return (
                <div key={g.title} className="space-y-10">
                  <h2 className="eyebrow border-b border-line pb-2">{g.title}</h2>
                  {g.sections.map((s, i) => (
                    <Block key={s.id} section={s} index={start + i + 1} />
                  ))}
                </div>
              );
            })}
          </div>

          <p className="mt-16 text-[13px] text-muted">
            Still stuck?{" "}
            <Link href="/support" className="text-accent hover:underline">
              Contact support
            </Link>
            .
          </p>
        </article>
      </div>
    </div>
  );
}
