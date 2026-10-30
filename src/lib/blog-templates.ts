export interface BlogPostTemplate {
  id: string;
  name: string;
  tagline: string;
  category: "Product Launch" | "Engineering Deep Dive" | "Community Update" | "Security & Reliability";
  defaultTitle: string;
  defaultSlug: string;
  defaultExcerpt: string;
  defaultAuthor: string;
  defaultReadTime: string;
  content: string;
}

export const BLOG_TEMPLATES: BlogPostTemplate[] = [
  {
    id: "product-launch",
    name: "🚀 Product Launch / Early Access",
    tagline: "Announce a brand-new product, public beta, or major release.",
    category: "Product Launch",
    defaultTitle: "Introducing [Product Name]: The Next Era of Community Operations",
    defaultSlug: "introducing-[product-slug]",
    defaultExcerpt: "Today we are officially unveiling [Product Name], built from the ground up for Discord servers and Roblox game studios.",
    defaultAuthor: "RoleFlow Engineering",
    defaultReadTime: "4 min read",
    content: `Today, we are thrilled to announce the official launch of [Product Name].

For the past several months, our focus has been singularly locked on eliminating the administrative bottlenecks that slow down online communities, Roblox development studios, and Discord teams.

What is [Product Name]?
[Product Name] is engineered to provide unified workflows, zero-friction setup, and enterprise-grade reliability without subscriptions or paywalls.

Key Highlights:
• Instant synchronization across your existing community stack.
• Real-time collaborative tools designed for fast-moving staff teams.
• Free forever with zero tiered locks or hidden fees.

Getting Started:
Early access is rolling out immediately. You can head over to our product portal right now and try it out with your team.

We cannot wait to hear your feedback. Drop your ideas and feature requests directly in our ideas portal!`,
  },
  {
    id: "engineering-deep-dive",
    name: "🛠️ Engineering & Architecture Deep Dive",
    tagline: "Share technical architectural decisions, database scaling, or performance wins.",
    category: "Engineering Deep Dive",
    defaultTitle: "How We Scaled RoleFlow to Handle High-Concurrency Community Traffic",
    defaultSlug: "scaling-roleflow-architecture",
    defaultExcerpt: "A look inside the distributed systems, custom domain routing, and caching layers powering the RoleFlow network.",
    defaultAuthor: "RoleFlow Systems Team",
    defaultReadTime: "6 min read",
    content: `Behind every responsive application portal and community dashboard lies an architecture designed to thrive under sudden traffic spikes.

When an application window opens or a studio announces hiring, hundreds of candidates flood the platform simultaneously. Here is how we engineered our infrastructure to handle it without skipping a beat.

1. Edge-First Host Routing:
By utilizing middleware running at the edge, every request is inspected and routed in single-digit milliseconds—whether it's targeting roleflow.site, applyhub.roleflow.site, or custom studio domains.

2. Isolated State and Database Optimization:
We separated high-throughput application voting from core identity storage. Connection pooling and query caching ensure database health even during peak recruitment waves.

3. Resilience & Self-Healing:
If a downstream external provider experiences degraded performance, our multi-layered fallback queues buffer interactions to prevent data loss.

Stay tuned for our upcoming open-source benchmarks and tooling releases!`,
  },
  {
    id: "community-update",
    name: "🌟 Community & Roadmap Recap",
    tagline: "Monthly highlights, community achievements, and what's coming next.",
    category: "Community Update",
    defaultTitle: "RoleFlow Community Recap: What We Shipped This Month",
    defaultSlug: "community-recap-this-month",
    defaultExcerpt: "A breakdown of community feedback implemented, feature improvements, and upcoming roadmap milestones.",
    defaultAuthor: "Jordan & The RoleFlow Team",
    defaultReadTime: "3 min read",
    content: `Welcome to this month's RoleFlow recap! 

Every improvement we ship begins with the suggestions and bug reports you submit on our feedback and ideas boards. Here is a look at what went live over the last 30 days:

Community Milestones:
• Over [X] new communities joined the RoleFlow ecosystem.
• Tens of thousands of applications processed with zero platform downtime.
• New dark-mode-first aesthetic shipped across the entire product suite.

What We Shipped:
• Unified Account Suite: Switch between Discord login and email/password authentication with one click.
• Expanded Admin Controls: Streamlined product configuration and instant announcement dispatches.
• Faster Page Transitions: Cut page load times across ApplyHub by 40%.

What's Next:
We are actively building Roster by RoleFlow and enhancing our Discord automation hooks. Thank you for building the future of online communities with us!`,
  },
  {
    id: "security-reliability",
    name: "🛡️ Security & Privacy Notice",
    tagline: "Updates regarding data protection, SSO safety, and platform integrity.",
    category: "Security & Reliability",
    defaultTitle: "Security & Privacy at RoleFlow: Protecting Your Community Data",
    defaultSlug: "security-and-privacy-update",
    defaultExcerpt: "How RoleFlow secures OAuth credentials, provides granular privacy exports, and keeps your data confidential.",
    defaultAuthor: "RoleFlow Security Team",
    defaultReadTime: "4 min read",
    content: `Trust is the foundation of every community. Whether you are running an 80,000-member Roblox group or a private developer collective, protecting your staff data and applicant submissions is our highest priority.

Our Security Architecture:
• End-to-End Session Signing: Every authentication cookie is cryptographically signed using HMAC SHA-256 with rotation support.
• Zero Data Selling: We never monetize user data or share candidate rosters with third parties.
• Full Data Portability: You can export your entire profile data or execute a permanent purge directly from your Account Suite.

Continuous Improvements:
We regularly run automated penetration checks, audit role escalation vectors, and enforce rate limits across sensitive endpoints.

If you ever identify a potential vulnerability, please reach out directly through our security disclosure channel at roleflow.site/contact.`,
  },
];
