import LegalDocument from "@/components/legal/LegalDocument";

const sections = [
  { title: "Agreement to these terms", paragraphs: [
    "These Terms of Service form a binding agreement between you and [LEGAL ENTITY NAME] (\"RoleFlow\", \"we\", \"us\") for use of the RoleFlow website, applications, Discord integration, and related services (the \"Service\"). By creating an account, signing in, or using the Service, you agree to these Terms and to our Privacy Policy, Acceptable Use Policy, Cookie Policy, Billing Policy, and Community Guidelines.",
    "If you do not agree, do not use the Service. If you use the Service for a community or organization, you confirm that you may bind that organization to these Terms.",
  ]},
  { title: "Eligibility", paragraphs: [
    "You must be at least 13 years old, or the minimum age required by Discord in your country if that is higher, to use the Service. You must also be able to form a binding contract under the law where you live.",
    "If we learn that an account belongs to someone below the minimum age, we will close it.",
  ]},
  { title: "Accounts and sign-in", paragraphs: [
    "You sign in with your Discord account through Discord's OAuth flow. We receive the profile information Discord shares with us, including your username, avatar, and email address if you granted that permission.",
    "You are responsible for activity on your account and for keeping your Discord account secure. Site staff and administrators must enable two-factor authentication. Notify us promptly at [CONTACT EMAIL] if you believe your account has been compromised.",
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
  { title: "Limitation of liability", paragraphs: [
    "To the fullest extent permitted by law, we will not be liable for indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data, or goodwill arising from your use of the Service. Our total liability for any claim will not exceed the greater of the amount you paid us in the 12 months before the claim or [LIABILITY CAP AMOUNT].",
    "Some jurisdictions do not allow certain limitations, so some of these limits may not apply to you.",
  ]},
  { title: "Indemnification", paragraphs: [
    "You will defend and indemnify us against claims arising from your content, your use of the Service in breach of these Terms, or your violation of law or of another person's rights.",
  ]},
  { title: "Governing law and disputes", paragraphs: [
    "These Terms are governed by the laws of [GOVERNING LAW JURISDICTION], without regard to conflict-of-law rules. Courts located in [VENUE] have exclusive jurisdiction, except where mandatory consumer law gives you the right to bring claims where you live.",
    "[OPTIONAL: Binding arbitration and class-action waiver terms, to be reviewed by counsel before use.]",
  ]},
  { title: "Changes to these Terms", paragraphs: [
    "We may update these Terms. For material changes we will give at least 14 days' notice in the Service or by email. Continued use after the effective date means you accept the updated Terms.",
  ]},
  { title: "Contact", paragraphs: [
    "Questions about these Terms: [CONTACT EMAIL]. Postal address: [POSTAL ADDRESS].",
  ]},
];

export default function TermsOfServicePage() {
  return (
    <LegalDocument
      title="Terms of Service"
      subtitle="The agreement that governs your use of RoleFlow"
      updated="October 28, 2026"
      sections={sections}
    />
  );
}
