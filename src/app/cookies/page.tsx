import LegalDocument from "@/components/legal/LegalDocument";

const sections = [
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
  { title: "Changes and contact", paragraphs: [
    "We will update this policy when our use of cookies changes. Questions: [CONTACT EMAIL].",
  ]},
];

export default function CookiePolicyPage() {
  return (
    <LegalDocument
      title="Cookie Policy"
      subtitle="The cookies and local storage RoleFlow uses"
      updated="October 28, 2026"
      sections={sections}
    />
  );
}
