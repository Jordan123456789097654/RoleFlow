import type { PolicyData } from "@/lib/policies";

// Built-in policy text. The founder can override any of these from /founder/policies.
export const POLICY_DEFAULTS: Record<string, PolicyData> = {
  "privacy": {
    title: "Privacy Policy",
    subtitle: "How RoleFlow collects, uses, and protects personal information",
    updated: "October 29, 2026",
    sections: [
  { title: "Who we are", paragraphs: [
    "RoleFlow is operated by the RoleFlow Project Team (\"RoleFlow\", \"we\", \"us\"). For privacy requests and data inquiries, contact support@roleflow.site. Official community discord: https://discord.gg/tKPbCXbmr9.",
  ]},
  { title: "Information we collect", paragraphs: [
    "Account information from Discord: your Discord user ID, username, display name, avatar, and email address if you grant that permission.",
    "Roblox information if you link an account: your Roblox user ID, username, avatar, and account age.",
    "Application information you provide: answers to community questions, uploaded links, portfolio items, and status history.",
    "Community and staff information: messages, reviews and votes, internal notes, staff permissions, and community settings you enter.",
    "Security and account records: login device records (a hash of your browser's user-agent string, the first seen and last seen dates, and the browser name), two-factor setup for site administrators (encrypted secrets and hashed recovery codes), and audit log entries that record privileged actions.",
    "Technical information: operational error and delivery records, IP-address-based rate limit counters held briefly in memory, and standard request logs kept by our hosting provider.",
    "Cookies and local storage: described in our Cookie Policy.",
  ]},
  { title: "How we use information", paragraphs: [
    "To provide the Service: sign you in, show and route applications, send notifications, and run community features.",
    "To keep the Service secure: detect abuse, enforce our policies, prevent fraud, and investigate reports.",
    "To run the business: manage licenses, provide support, measure aggregate usage such as weekly community counts, and improve the Service.",
    "To comply with law and respond to valid legal requests.",
  ]},
  { title: "Legal bases (EEA and UK)", paragraphs: [
    "Where the GDPR or UK GDPR applies, we rely on: performance of a contract (providing the Service you asked for); legitimate interests (security, abuse prevention, aggregate analytics, and business operations, weighed against your rights); consent (optional features such as Roblox linking and email notifications, which you can withdraw at any time); and legal obligation where applicable.",
  ]},
  { title: "Who sees your information", paragraphs: [
    "Community owners and their staff see applications and applicant information submitted to their community, including linked Discord and Roblox details, and the reviews and notes staff add.",
    "Site administrators and the founder can see account, moderation, and audit information needed to operate the platform, as described in our Community Guidelines.",
    "Service providers process information for us under contract: Discord (sign-in and bot delivery, United States), Resend (transactional email, United States), and our hosting and PostgreSQL cloud database infrastructure.",
    "We do not sell your personal information, and we do not use advertising cookies.",
  ]},
  { title: "Retention", paragraphs: [
    "We keep account information while your account exists. Applications remain with the community that received them, subject to that community's own retention practices. When you delete your account, we delete your profile and the applications you submitted. Some records are kept for longer where required by law, for security, or to resolve disputes, including audit log entries and punishment records.",
  ]},
  { title: "Security", paragraphs: [
    "We use encryption in transit, signed session cookies that are checked against a per-account version so sessions can be revoked, two-factor authentication for site administrators, role-based access controls, and audit logging of privileged actions. No system is perfectly secure, and you should use a strong, unique password for any linked service and enable Discord's two-factor authentication.",
  ]},
  { title: "Your rights", paragraphs: [
    "Depending on where you live, you may have the right to access, correct, delete, or export your personal information; to object to or restrict processing; to withdraw consent; and to complain to a supervisory authority.",
    "You can download a copy of your data from Settings, and you can delete your account there. For other requests, email support@roleflow.site. We will verify your identity before responding and aim to respond within 30 days.",
    "California residents have additional rights under the CCPA/CPRA, including the right to know and the right to delete. We do not sell or share personal information for cross-context behavioral advertising.",
  ]},
  { title: "Children", paragraphs: [
    "The Service is not directed to children under 13, or the higher minimum age in your country. We do not knowingly collect personal information from them. If you believe a child has provided information to us, contact support@roleflow.site and we will delete it.",
  ]},
  { title: "International transfers", paragraphs: [
    "We may process information in countries other than where you live, including the United States. Where required, we rely on appropriate safeguards such as standard contractual clauses and end-to-end transport encryption.",
  ]},
  { title: "Cookies", paragraphs: [
    "We use cookies and local storage as described in our Cookie Policy.",
  ]},
  { title: "Changes to this policy", paragraphs: [
    "We will post changes here and update the date above. For material changes we will give at least 14 days' notice, and where required we will seek your consent again.",
  ]},
  { title: "Removing specific information", paragraphs: [
    `You do not have to delete your whole account to remove particular information. In Settings, open the Danger Zone and use the Remove specific data panel. You can remove the email address stored on your RoleFlow account, your verified company email, your Roblox link, your saved profile answers, server-side copies of unsubmitted application drafts, and the browser records we keep for new-device alerts.`,
    `When you remove your email address, we also turn off email notifications, because we no longer have an address to send them to. We record the removal so that signing in with Discord does not copy the address back onto your account. We do not currently offer a way to restore an email address you have removed, so if you want status emails again, you will need to contact support or ask support to help you set up notifications again.`,
    `Removing your Roblox link clears your Roblox ID, username, and avatar. Some communities ask applicants to link a Roblox account before they can apply. If you remove the link, you may need to link it again before applying to those communities. Your past applications keep the Roblox details that were attached when you submitted them, because those details form part of the application the community received.`,
    `Removing an item takes effect in our active systems straight away. Copies that exist in database backups are removed as those backups expire, as described in the Backups section below.`,
  ]},
  { title: "Deleting your account", paragraphs: [
    `You can delete your account from Settings in the Danger Zone by typing DELETE to confirm. Deletion is permanent and cannot be reversed. Before you delete, consider exporting your data using the download option in Settings, because the export will not be available once the account is gone.`,
    `Deletion is blocked in two cases. First, if you own one or more communities on RoleFlow, you must transfer or delete those communities first, because a community cannot be left without an owner. Second, the Platform Founder account cannot be deleted through the Settings page.`,
    `When your account is deleted, we remove your profile record, the applications you submitted, the messages and answers attached to those applications, the login device records, your saved drafts, and the review records you created as a staff member. The communities you applied to lose access to your applications at that point, because the applications are removed with your account.`,
    `Some information is kept after deletion. Audit log entries that record privileged actions remain for security and accountability, and they may still refer to your user ID. Punishment, ban, and safety records are kept for as long as needed to enforce our policies and prevent people who were removed for serious violations from returning. We keep only what is needed for those purposes and limit access to it.`,
  ]},
  { title: "Data we receive from Discord and Roblox", paragraphs: [
    `When you sign in with Discord, we receive the profile details Discord makes available to us under the permissions you grant. Each time you sign in, we refresh the username, display name, avatar, and email address from Discord, except where you have removed your email address as described above. We do not receive your Discord password, your messages, or your friends list.`,
    `If you link a Roblox account, we receive your public Roblox user ID, username, avatar, and account age. We use that information to verify that the account exists and to show it to communities you apply to. We do not receive your Roblox password. Roblox handles its own sign-in, and its own privacy policy applies to the information it holds.`,
  ]},
  { title: "Automated processing", paragraphs: [
    `RoleFlow provides tools that help community staff organize their work, such as sorting applications, assigning reviewers, flagging items for a second opinion, and showing open workload. These tools do not make hiring or acceptance decisions. Decisions about applications are made by community owners and staff, who are responsible for them.`,
    `We do not use fully automated means to make decisions about you that have legal or similarly significant effects. If that ever changes, we will tell you in advance and explain how to ask for a human review.`,
  ]},
  { title: "Communities as separate controllers", paragraphs: [
    `Each community that receives your application decides how long it keeps the information you submitted and what it does with it. RoleFlow stores that information for the community and follows the community's instructions, but the community is responsible for its own copies, exports, and retention. If you want a community to delete your application or stop holding your information, ask the community directly. You can also withdraw an application from the application page, and you can ask us for help if a community does not respond.`,
    `When you export your data, the export includes the applications you submitted and the messages you sent, so you can see what each community holds. It does not include copies that a community has exported on its own.`,
  ]},
  { title: "Backups", paragraphs: [
    `Our database is backed up by our hosting and database providers so that we can recover from failures. When you remove information or delete your account, we remove it from our active systems immediately. Backup copies are then overwritten or expire on the provider's schedule, which is [backup retention period to be confirmed]. During that period, the backup copies are kept under the same security controls as the live data and are not used for any other purpose.`,
  ]},
  { title: "How to exercise your rights", paragraphs: [
    `The fastest way to act on your rights is in Settings. You can download a copy of your data, remove specific information, or delete your account at any time, and these options do not require you to contact us.`,
    `For requests that the Settings page cannot handle, such as a request for information we hold that is not shown in your export, a correction to information you cannot edit yourself, or a question about how we have used your information, email support@roleflow.site from the address on your account where possible. We may ask you to confirm your identity, usually by answering questions only you would know or by signing in again, before we act on the request. We aim to respond within 30 days and will tell you if we need longer.`,
    `We generally do not charge a fee for these requests. If a request is clearly unfounded or repeated excessively, we may refuse it or charge a reasonable fee, and we will explain why.`,
  ]},
  { title: "Complaints", paragraphs: [
    `If you have a concern about how we handle your information, please contact us first so we can try to resolve it. If you are not satisfied, you have the right to lodge a complaint with the data protection authority in the country where you live or work, or where the alleged problem occurred. Residents of the EEA and UK can find their authority through their national regulator's website.`,
  ]},
  { title: "Contact", paragraphs: [
    "Privacy questions and requests: support@roleflow.site. Online community desk: https://discord.gg/tKPbCXbmr9.",
  ]},
]
  },
  "terms": {
    title: "Terms of Service",
    subtitle: "The agreement that governs your use of RoleFlow",
    updated: "October 29, 2026",
    sections: [
  { title: "Agreement to these terms", paragraphs: [
    "These Terms of Service form a binding agreement between you and RoleFlow (\"RoleFlow\", \"we\", \"us\") for use of the RoleFlow website, applications, Discord integration, and related services (the \"Service\"). By creating an account, signing in, or using the Service, you agree to these Terms and to our Privacy Policy, Acceptable Use Policy, Cookie Policy, Billing Policy, and Community Guidelines.",
    "If you do not agree, do not use the Service. If you use the Service for a community or organization, you confirm that you may bind that organization to these Terms.",
  ]},
  { title: "Eligibility", paragraphs: [
    "You must be at least 13 years old, or the minimum age required by Discord in your country if that is higher, to use the Service. You must also be able to form a binding contract under the law where you live.",
    "If we learn that an account belongs to someone below the minimum age, we will close it.",
  ]},
  { title: "Accounts and sign-in", paragraphs: [
    "You sign in with your Discord account through Discord's OAuth flow. We receive the profile information Discord shares with us, including your username, avatar, and email address if you granted that permission.",
    "You are responsible for activity on your account and for keeping your Discord account secure. Site staff and administrators must enable two-factor authentication. Notify us promptly at support@roleflow.site if you believe your account has been compromised.",
    "You may sign out or delete your account at any time from Settings. Deleting an account that owns a community is blocked until the community is transferred or deleted.",
  ]},
  { title: "Communities and owner responsibilities", paragraphs: [
    "A community owner is responsible for the positions, questions, applicant communications, staff access, and decisions made in that community. Owners must comply with our Community Guidelines and applicable law, including employment, anti-discrimination, and data protection law where they apply.",
    "Owners decide who receives staff access. Staff act on the owner's behalf and must follow these Terms. Owners are responsible for the actions of their staff within RoleFlow.",
  ]},
  { title: "Applications and applicant data", paragraphs: [
    "When you apply to a community, your answers and linked profile information are shared with that community's owner and staff so they can review your application. RoleFlow does not make hiring or acceptance decisions and is not a party to the relationship between you and a community.",
    "Communities are responsible for how they use applicant data. Report concerns to us using the Report button on a community page.",
  ]},
  { title: "Licenses and paid features", paragraphs: [
    "Some features are available under a license. Licenses may be scoped to a single community or to an account, and they may have a duration. Terms of purchase, pricing, expiry, and refunds are set out in our Billing Policy.",
    "We may turn licensing on or off. While licensing is off, paid features are available without charge. We will give notice before enabling licensing for features you currently use for free, and we will not remove data you have created as a result of a change to licensing.",
  ]},
  { title: "Your content", paragraphs: [
    "You keep ownership of content you submit, including community descriptions, position text, applications, messages, and reviews. You grant us a worldwide, non-exclusive, royalty-free license to host, store, copy, display, and transmit that content only as needed to operate and improve the Service and to show it to the people you intend to see it.",
    "You are responsible for content you submit and represent that you have the rights needed to submit it. We may remove content that violates these Terms or our policies.",
  ]},
  { title: "Acceptable use", paragraphs: [
    "You must follow our Acceptable Use Policy. Among other things, you may not use the Service for scams, phishing, impersonation, harassment, spam, unlawful discrimination, or to collect data without authorization.",
  ]},
  { title: "Third-party services", paragraphs: [
    "The Service relies on third parties, including Discord, Roblox, our email provider, and hosting providers. Their terms apply to your use of their services. We are not responsible for their availability or actions, but we will tell you when a third-party change materially affects the Service.",
  ]},
  { title: "Beta and changes to the Service", paragraphs: [
    "RoleFlow is in beta. Features may change, be removed, or be unavailable, and the Service may have bugs or interruptions. We will try to give reasonable notice of material changes.",
    "We may modify, suspend, or discontinue any part of the Service. We may also perform scheduled or emergency maintenance, during which some or all features may be unavailable.",
  ]},
  { title: "Moderation, punishments, and appeals", paragraphs: [
    "We may remove content, pause communities, suspend or ban accounts, and take other action to enforce these Terms. Where practical, we will tell you the reason and give you a way to appeal, as described in our Community Guidelines.",
    "Bans and suspensions end your active sessions. A signed appeal link is sent with the notice, and appeals are reviewed by site administrators.",
  ]},
  { title: "Termination", paragraphs: [
    "You may stop using the Service at any time. We may suspend or terminate your access if you breach these Terms, if required by law, or if continuing to provide the Service to you would create a legal or security risk.",
    "On termination, the sections of these Terms that by their nature should survive will continue to apply, including ownership, disclaimers, liability limits, and dispute provisions.",
  ]},
  { title: "Disclaimers", paragraphs: [
    "The Service is provided \"as is\" and \"as available\", without warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement, to the fullest extent permitted by law.",
  ]},
  { title: "Limitation of liability & Total Disclaimer", paragraphs: [
    "To the maximum extent permitted by applicable law, RoleFlow, its founders, operators, contributors, and affiliates shall have ZERO liability to you or any third party for any direct, indirect, incidental, special, consequential, exemplary, or punitive damages whatsoever.",
    "This includes, without limitation, damages for loss of profits, revenue, data, goodwill, service interruptions, server downtime, community disputes, or unauthorized access, whether based on warranty, contract, tort (including negligence), product liability, or any other legal theory, even if we have been advised of the possibility of such damages.",
    "Your sole and exclusive remedy for dissatisfaction with the Service is to discontinue using RoleFlow. Under no circumstances will RoleFlow assume any financial, operational, or legal liability in connection with your use of the platform.",
  ]},
  { title: "Indemnification", paragraphs: [
    "You will defend and indemnify us against claims arising from your content, your use of the Service in breach of these Terms, or your violation of law or of another person's rights.",
  ]},
  { title: "Governing law and disputes", paragraphs: [
    "These Terms are governed by the laws of the State of Delaware and applicable United States federal law, without regard to conflict-of-law rules. Any dispute arising out of or relating to these Terms shall be resolved through informal dispute resolution by contacting support@roleflow.site, or before competent state or federal courts, except where mandatory consumer protection regulations grant you the right to bring claims in your jurisdiction of residence.",
  ]},
  { title: "Changes to these Terms", paragraphs: [
    "We may update these Terms. For material changes we will give at least 14 days' notice in the Service or by email. Continued use after the effective date means you accept the updated Terms.",
  ]},
  { title: "Acceptable use", paragraphs: [
    `Your use of the Service must comply with our Acceptable Use Policy, which is part of these Terms. The Acceptable Use Policy describes the conduct that is not permitted, including harassment, impersonation, fraud, unlawful screening, and attempts to interfere with the platform. A violation of that policy is a violation of these Terms.`,
  ]},
  { title: "Your content and the licence you give us", paragraphs: [
    `You keep ownership of the content you submit to RoleFlow, such as application answers, messages, reviews, community descriptions, and images. You are responsible for making sure that content is accurate and that you have the right to share it.`,
    `You give RoleFlow a non-exclusive, worldwide, royalty-free licence to host, store, copy, transmit, display, and back up your content, but only to the extent needed to operate the Service and to show your content to the people you chose to share it with. For example, a community you apply to can see your application. This licence ends when you delete the content or your account, except for copies kept in backups and records we must retain as described in our Privacy Policy.`,
  ]},
  { title: "Feedback", paragraphs: [
    `If you send us suggestions or ideas about the Service, you agree that we may use them without paying you or owing you any other obligation. You are not required to send feedback, and we will not treat feedback as confidential unless we agree to do so in writing.`,
  ]},
  { title: "Third-party services", paragraphs: [
    `RoleFlow relies on third-party services, including Discord for sign-in and bot delivery, Roblox for account linking and profile information, and email and hosting providers. Those services are governed by their own terms and privacy policies. We are not responsible for their availability, their changes to their services, or their handling of information they hold.`,
    `Community pages may link to third-party sites, including community Discord servers and websites owned by communities. We do not control those sites and do not endorse them. Use caution when sharing personal information with anyone outside RoleFlow, and never send money, bank details, or identity documents to someone you have met only through an application.`,
  ]},
  { title: "Service availability and changes", paragraphs: [
    `We work to keep the Service available, but we do not promise that it will be uninterrupted or error-free. We may perform maintenance, which may cause temporary interruptions, and we may suspend or limit parts of the Service where needed for security, legal compliance, or to protect other users.`,
    `We may change or discontinue features over time. Where a change materially reduces the functionality you rely on, we will give notice where reasonably possible. We will not change these Terms in a way that significantly reduces your rights without giving you notice, as described in the Changes section below.`,
  ]},
  { title: "Suspension and termination", paragraphs: [
    `You may stop using the Service at any time and delete your account from Settings. We may suspend or terminate your access if you breach these Terms, if we reasonably believe you are using the Service unlawfully or to harm others, or if we are required to do so by law. Where practical, we will tell you the reason and explain how to appeal through the appeal page.`,
    `When your access ends, the provisions of these Terms that by their nature should survive will continue to apply. That includes the licence needed for backups and retained records, the disclaimers, the limitation of liability, and the dispute terms.`,
  ]},
  { title: "Disclaimers", paragraphs: [
    `The Service is provided on an as-is and as-available basis. To the fullest extent permitted by law, we disclaim warranties of any kind, whether express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not guarantee that a community will accept your application, that a position will remain open, or that any community's hiring process is fair or lawful. Those matters are between you and the community.`,
  ]},
  { title: "Limitation of liability", paragraphs: [
    `To the fullest extent permitted by law, RoleFlow and its operators will not be liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, lost opportunities, or lost data, arising from or related to the Service. Our total liability for any claim relating to the Service will not exceed [liability cap to be confirmed by counsel], or the amount you paid us for the Service in the twelve months before the claim, whichever is greater.`,
    `Some jurisdictions do not allow certain limitations of liability, so some of the limits above may not apply to you. Nothing in these Terms limits liability that cannot be limited under applicable law, including liability for fraud or for death or personal injury caused by negligence.`,
  ]},
  { title: "Indemnity", paragraphs: [
    `You agree to defend and indemnify RoleFlow against claims, losses, and reasonable legal costs arising from your content, your use of the Service in breach of these Terms, or your violation of anyone else's rights. This does not apply to claims caused by our own wrongful conduct.`,
  ]},
  { title: "Disputes and governing law", paragraphs: [
    `These Terms are governed by the laws of [governing jurisdiction to be confirmed]. Before starting formal proceedings, please contact us at support@roleflow.site so we can try to resolve the issue informally. Any formal dispute will be brought in the courts of [venue to be confirmed], unless applicable consumer law gives you the right to bring a claim where you live.`,
  ]},
  { title: "General terms", paragraphs: [
    `These Terms, together with the policies they incorporate, are the entire agreement between you and RoleFlow about the Service and replace any earlier understanding on the same subject. If a provision is found to be unenforceable, the rest of these Terms remain in effect.`,
    `Our failure to enforce a provision is not a waiver of it. You may not assign these Terms without our written consent. We may assign them to a successor that takes over the Service, and we will notify you if that happens.`,
  ]},
  { title: "Contact", paragraphs: [
    "Questions about these Terms: support@roleflow.site. For community support or appeals, visit our official community server at https://discord.gg/tKPbCXbmr9.",
  ]},
]
  },
  "acceptable-use": {
    title: "Acceptable Use Policy",
    subtitle: "What is and is not allowed on RoleFlow",
    updated: "October 29, 2026",
    sections: [
  { title: "Purpose", paragraphs: [
    "This policy describes what you may and may not do on RoleFlow. It applies to everyone who uses the Service, including applicants, community owners, staff, and administrators.",
  ]},
  { title: "Scams, phishing, and deception", paragraphs: [
    "You may not create pages, positions, descriptions, banners, or messages that imitate a login screen, ask for passwords or two-factor codes, promise prizes or giveaways in exchange for personal information, pretend to be Discord, Roblox, RoleFlow, or another company, or otherwise trick people into revealing personal information or installing software.",
    "Pages that ask applicants to \"verify\" an account, pay a fee, or download software through RoleFlow are prohibited.",
  ]},
  { title: "Spam and fake activity", paragraphs: [
    "Do not create communities, positions, or applications for purposes other than genuine recruitment. Do not submit applications you do not intend to pursue, flood a community with duplicate submissions, post the same content repeatedly, or use automation to create accounts or content.",
  ]},
  { title: "Harassment and hate", paragraphs: [
    "Do not threaten, harass, bully, dox, or sexually harass anyone. Do not use the Service to promote hatred or violence against people based on race, ethnicity, national origin, religion, sex, gender identity, sexual orientation, disability, or age, or against any other protected group.",
    "Do not use staff notes, reviews, messages, or decision notes to demean an applicant.",
  ]},
  { title: "Unlawful discrimination and unfair hiring", paragraphs: [
    "Community owners and staff must not use RoleFlow to make decisions based on protected characteristics where that is unlawful, and must not solicit information that the law forbids them to ask for in a recruitment process.",
  ]},
  { title: "Minors", paragraphs: [
    "Do not solicit personal information, images, or private contact from anyone under 18 through RoleFlow. Do not create positions or questions that ask minors for sensitive information. Any sexual content involving minors is prohibited and will be reported to the appropriate authorities.",
  ]},
  { title: "Impersonation and false claims", paragraphs: [
    "Do not impersonate another person, staff member, verified community, or RoleFlow itself. Do not claim a verified badge, partner status, or license you do not hold.",
  ]},
  { title: "Security and abuse of the platform", paragraphs: [
    "Do not attempt to access accounts or data you are not authorized to access, probe or disrupt the Service, bypass rate limits, licensing limits, or access controls, scrape the Service at a rate that harms it, distribute malware, or abuse the Discord integration.",
    "Do not share your session cookies, two-factor recovery codes, or bot tokens with anyone.",
  ]},
  { title: "Intellectual property", paragraphs: [
    "Do not post content you do not have the right to use. Respect the copyright, trademarks, and other rights of others, including game assets, logos, and music.",
  ]},
  { title: "Harassment and abuse", paragraphs: [
    `Do not harass, threaten, intimidate, stalk, or demean any person through RoleFlow, whether an applicant, a staff member, an owner, or anyone else. This includes repeatedly contacting someone who has asked you to stop, sending abusive messages through application threads, posting private information about someone without their consent, and encouraging others to target a person.`,
  ]},
  { title: "Impersonation and false identity", paragraphs: [
    `Do not pretend to be another person, a community, a studio, or a RoleFlow employee. Do not claim a Roblox or Discord account that is not yours, and do not link a Roblox account to your profile unless you control it. Staff badges, verified labels, and official names are reserved for accounts that are actually authorized to use them.`,
  ]},
  { title: "Scams, fake positions and fraud", paragraphs: [
    `Do not post positions that do not exist, use a position to collect personal information you do not need, or ask applicants for money, fees, gift cards, cryptocurrency, bank details, or identity documents as a condition of applying or being hired. Do not use RoleFlow to run investment schemes, pyramid schemes, or other deceptive commercial offers dressed up as jobs or applications.`,
    `If you are an applicant and you receive a request of this kind, report it using the Report button. We will investigate and may remove the community, the content, or the account involved.`,
  ]},
  { title: "Discriminatory or unlawful screening", paragraphs: [
    `Communities may set requirements that are lawful and relevant to the role, such as age, experience, time zone, or portfolio. They must not use RoleFlow to screen out applicants on the basis of protected characteristics where that is unlawful, or to collect sensitive information that the role does not need. Questions about health, religion, sexual orientation, pregnancy, or immigration status are generally not appropriate in an application form.`,
  ]},
  { title: "Scraping, automation and abuse of the platform", paragraphs: [
    `Do not collect information from RoleFlow by automated means, such as scraping community pages or applicant data, unless we have given you written permission. Do not use bots, scripts, or accounts to submit applications at scale, vote in reviews to manipulate results, or create accounts to evade a ban or suspension.`,
    `Do not attempt to probe, scan, or test the security of the Service without our written permission. If you find a security issue, report it to support@roleflow.site and give us a reasonable chance to fix it before you disclose it publicly.`,
  ]},
  { title: "Malicious content", paragraphs: [
    `Do not upload or link to malware, phishing pages, or content designed to compromise other people's devices or accounts. Do not share links that impersonate Discord or Roblox sign-in pages. Links in application answers and community descriptions are checked and may be removed if they are unsafe.`,
  ]},
  { title: "Enforcement", paragraphs: [
    `We take action in proportion to the seriousness and frequency of a violation. Depending on the circumstances, we may remove content, issue a warning, limit features, suspend a community or account, or permanently remove access. Serious violations, such as threats of violence, child sexual abuse material, or fraud, may result in immediate removal and reporting to law enforcement where required.`,
    `If you believe we made a mistake, you can submit an appeal through the appeal page. Appeals are reviewed by someone other than the person who made the original decision where possible. We will tell you the outcome and the reasons for it.`,
  ]},
  { title: "Reporting and enforcement", paragraphs: [
    "Report violations with the Report button on a community or position page, or by contacting support@roleflow.site. We review reports and may remove content, pause or blacklist communities, suspend or ban accounts, or close reports without action.",
    "Repeated or serious violations may result in permanent removal. Appeals follow our Community Guidelines.",
  ]},
]
  },
  "community-guidelines": {
    title: "Community Guidelines",
    subtitle: "Expectations for owners, staff, and applicants, and how enforcement works",
    updated: "October 29, 2026",
    sections: [
  { title: "Purpose", paragraphs: [
    "These guidelines set the expectations for communities, owners, staff, and applicants. They apply alongside our Terms of Service and Acceptable Use Policy.",
  ]},
  { title: "For community owners", paragraphs: [
    ["Describe your community and positions honestly. Do not advertise roles you are not hiring for or promise outcomes you cannot give.",
     "Ask applicants only for information needed to assess the role, and do not ask for passwords, payment details, or two-factor codes.",
     "Give staff only the access they need. Remove staff who leave your team.",
     "Respond to applicants in a reasonable time and tell them clearly when a decision is made.",
     "Keep applicant data for as long as needed for the purpose, and delete it when asked where the law requires."],
  ]},
  { title: "For staff", paragraphs: [
    ["Review applications on their merits and record reasons for decisions where practical.",
     "Keep reviews, notes, and messages professional. Do not share applicant information outside the community.",
     "Do not use RoleFlow to make decisions based on protected characteristics.",
     "Use the voting and decision permissions your owner gave you, and do not act beyond them."],
  ]},
  { title: "For applicants", paragraphs: [
    ["Answer honestly and apply only to roles you intend to pursue.",
     "Do not create multiple applications to the same role, or flood a community with applications.",
     "Be respectful in messages to staff."],
  ]},
  { title: "Reporting", paragraphs: [
    "Report a community or position using the Report button on its page. Several separate reports about the same target are reviewed together, and the reporter count is one of the signals we use. Reports are not votes: one serious report can be enough, and many weak reports do not guarantee action.",
  ]},
  { title: "How we respond", paragraphs: [
    ["Warning: a notice that a rule was broken, with no restriction.",
     "Pause: a community is hidden from the public directory while the issue is reviewed. Its owner can still access it.",
     "Blacklist: a community is removed from public listing and its applications stop being accepted.",
     "Suspension: an account cannot sign in for a set period.",
     "Ban: an account cannot sign in. Bans are usually permanent.",
     "Content removal: content that breaks our rules may be removed without other action."],
  ]},
  { title: "Notice and appeals", paragraphs: [
    "When we take action against an account or community, we tell the owner or account holder the action and the reason, unless disclosure would be unlawful or would undermine a security investigation. We send an appeal link in the notice. Submit one appeal per decision, explaining why it should be reconsidered. A site administrator reviews each appeal and we will email you the outcome. Denied appeals are final on the platform, but you may still contact us about data rights under our Privacy Policy.",
  ]},
  { title: "Transparency", paragraphs: [
    "We keep an audit record of privileged actions such as punishments and role changes. Enforcement decisions are recorded so they can be reviewed later.",
  ]},
  { title: "Honest and clear postings", paragraphs: [
    `Describe each position accurately. Say what the role involves, what skills it needs, whether it is paid or unpaid, the expected time commitment, and how long applicants should expect to wait for a decision. Close positions when they are filled instead of leaving them open to collect applications you do not intend to review.`,
  ]},
  { title: "Respectful communication with applicants", paragraphs: [
    `Acknowledge applications, tell applicants when a decision is made, and be honest about the reasons where you reasonably can. Use the interview and message tools for conversation rather than contacting applicants through unrelated channels. Keep feedback specific and professional, and do not mock, insult, or pressure applicants, including when you decline them.`,
  ]},
  { title: "Handling applicant information", paragraphs: [
    `Applicants share personal information with you to be considered for a role. Use it only to assess the application, keep it secure, share it only with people who need it for that purpose, and delete or stop holding it when you no longer need it. Do not copy applicant details into public channels, post screenshots of applications, or use applicant information for marketing.`,
    `Owners are responsible for how their staff handle applicant information. If a staff member misuses it, remove their access immediately and tell us if you need help with the consequences.`,
  ]},
  { title: "Staff conduct", paragraphs: [
    `Staff should review applications fairly, follow the community's written criteria, and declare any conflict of interest, such as a personal or financial relationship with an applicant. Staff should not share private review notes outside the team or use their access to pursue personal disputes.`,
  ]},
  { title: "Reporting and appeals", paragraphs: [
    `If a community or applicant breaks these guidelines, report it using the Report button on the community page or the application. Please give specific details and any evidence you have. Reports are reviewed by our moderation team, and we do not reveal who reported a community to the community itself.`,
    `If your community or account has been restricted and you believe the decision was wrong, use the appeal page. You will receive a response explaining the outcome.`,
  ]},
  { title: "Changes to these guidelines", paragraphs: [
    `We may update these guidelines as the platform and the law change. We will post changes here and update the date at the top of the page. If a change affects how communities must run their applications, we will tell community owners in advance where practical.`,
  ]},
  { title: "Changes", paragraphs: [
    "We may update these guidelines. Material changes are announced in the Service.",
  ]},
]
  },
  "cookies": {
    title: "Cookie Policy",
    subtitle: "The cookies and local storage RoleFlow uses",
    updated: "October 29, 2026",
    sections: [
  { title: "What cookies and local storage are", paragraphs: [
    "Cookies are small files stored by your browser. Local storage is similar data kept in your browser for a site. We use both only where needed to run the Service.",
  ]},
  { title: "Cookies we set", paragraphs: [
    ["roleflow_user_id: keeps you signed in. It holds a signed value that the server checks on each request. It is httpOnly, so page scripts cannot read it. It lasts 30 days, or until you sign out or your sessions are revoked.",
     "roleflow_2fa_pending: holds the short-lived step between Discord sign-in and the two-factor check for site administrators. It lasts 10 minutes and is cleared when the check completes."],
  ]},
  { title: "Local storage", paragraphs: [
    ["Application drafts: saved in your browser so an unsubmitted application is not lost if you close the tab. Drafts stay on your device.",
     "Staff overview: a timestamp of your last visit to each community dashboard, so the overview can show what is new."],
  ]},
  { title: "Cookies and tools we do not use", paragraphs: [
    "We do not set advertising or cross-site tracking cookies. If we add analytics in the future, we will update this policy and, where required, ask for your consent first.",
  ]},
  { title: "Embedded content", paragraphs: [
    "Community pages may embed Discord's public server widget. Discord may set its own cookies when that widget loads. Those cookies are governed by Discord's policies.",
  ]},
  { title: "Your choices", paragraphs: [
    "Most browsers let you block or delete cookies and clear local storage. If you block the essential cookies, you will not be able to stay signed in. Clearing local storage removes saved drafts and the overview timestamp.",
  ]},
  { title: "Why we use each item", paragraphs: [
    `roleflow_user_id is needed to keep you signed in across page visits. Without it, every page would ask you to sign in again. It is the only cookie that identifies your session.`,
    `roleflow_2fa_pending is needed to complete two-factor authentication for site administrators. It exists only between the Discord sign-in step and the second-factor check, and it is removed when that check is complete or expires.`,
    `Application drafts in local storage let you return to an unsubmitted application on the same device without losing your answers. Server-side copies of drafts are separate and can be removed in Settings.`,
    `The overview timestamp in local storage remembers when you last opened a community dashboard so that the overview can show what has changed since then. It contains no personal details beyond the time of your visit.`,
  ]},
  { title: "How long they last", paragraphs: [
    `The sign-in cookie lasts up to 30 days, unless you sign out, your sessions are revoked, or the cookie is otherwise cleared sooner. Signing out clears it immediately. The two-factor cookie lasts ten minutes at most. Local storage items remain until you clear them or the site removes them.`,
  ]},
  { title: "Consent", paragraphs: [
    `The cookies and local storage described above are strictly necessary to provide the Service you asked for. Because of that, we do not ask for consent before setting them. If we introduce any cookie that is not strictly necessary, such as analytics, we will ask for your consent first, explain what it does, and let you refuse it without losing access to the Service.`,
  ]},
  { title: "Managing cookies and local storage in your browser", paragraphs: [
    `Every major browser lets you view, block, and delete cookies and local storage. Usually you can find these settings under privacy or site settings, and you can clear data for a single site without affecting others. Clearing RoleFlow's cookies will sign you out. Clearing local storage removes saved drafts in this browser and the overview timestamp, but does not delete anything from your account.`,
    `Some browsers offer private or incognito windows. Items set in those windows are usually removed when the window is closed. Sign-in will not persist in a private window unless you sign in again there.`,
  ]},
  { title: "Third-party sites and widgets", paragraphs: [
    `When you sign in with Discord, Discord may set its own cookies on its sign-in pages. When a community page shows Discord's public server widget, Discord may also set cookies. Those cookies are governed by Discord's own cookie policy, and we do not control them. Links to Roblox, Discord, and other external sites take you away from RoleFlow, and their cookie practices apply once you are there.`,
  ]},
  { title: "Hosting and server logs", paragraphs: [
    `Our hosting provider receives technical information when you use the Service, such as IP addresses, request times, and the pages requested. This information is used to deliver the Service, keep it secure, and diagnose faults. It is not used to set advertising or cross-site tracking cookies.`,
  ]},
  { title: "Do Not Track and similar signals", paragraphs: [
    `Some browsers send a Do Not Track signal. Because we do not use cookies for advertising or cross-site tracking, we do not respond to that signal differently. Our practices are described in full on this page and in our Privacy Policy.`,
  ]},
  { title: "Changes and contact", paragraphs: [
    "We will update this policy when our use of cookies changes. Questions: support@roleflow.site.",
  ]},
]
  },
};
