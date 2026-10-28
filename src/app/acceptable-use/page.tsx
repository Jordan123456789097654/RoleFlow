import LegalDocument from "@/components/legal/LegalDocument";

const sections = [
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
  { title: "Reporting and enforcement", paragraphs: [
    "Report violations with the Report button on a community or position page, or by contacting support@roleflow.site. We review reports and may remove content, pause or blacklist communities, suspend or ban accounts, or close reports without action.",
    "Repeated or serious violations may result in permanent removal. Appeals follow our Community Guidelines.",
  ]},
];

export default function AcceptableUsePage() {
  return (
    <LegalDocument
      title="Acceptable Use Policy"
      subtitle="What is and is not allowed on RoleFlow"
      updated="October 28, 2026"
      sections={sections}
    />
  );
}
