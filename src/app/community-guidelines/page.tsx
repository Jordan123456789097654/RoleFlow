import LegalDocument from "@/components/legal/LegalDocument";

const sections = [
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
  { title: "Changes", paragraphs: [
    "We may update these guidelines. Material changes are announced in the Service.",
  ]},
];

export default function CommunityGuidelinesPage() {
  return (
    <LegalDocument
      title="Community Guidelines"
      subtitle="Expectations for owners, staff, and applicants, and how enforcement works"
      updated="October 28, 2026"
      sections={sections}
    />
  );
}
