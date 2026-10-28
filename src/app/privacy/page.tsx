import LegalDocument from "@/components/legal/LegalDocument";

const sections = [
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
  { title: "Contact", paragraphs: [
    "Privacy questions and requests: support@roleflow.site. Online community desk: https://discord.gg/tKPbCXbmr9.",
  ]},
];

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      subtitle="How RoleFlow collects, uses, and protects personal information"
      updated="October 28, 2026"
      sections={sections}
    />
  );
}
