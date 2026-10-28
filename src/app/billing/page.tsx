import LegalDocument from "@/components/legal/LegalDocument";

const sections = [
  { title: "Current status", paragraphs: [
    "RoleFlow is in beta. While licensing is turned off, all paid features are available at no charge, and no payment is taken. We will announce any change to this status in advance.",
  ]},
  { title: "What licenses cover", paragraphs: [
    "A license key unlocks paid features for either one community (a community license) or one account (an account license). Community licenses are redeemed by the community owner. Account licenses are redeemed by the account holder and raise the number of communities that account may own.",
    "Free communities are limited to three open positions. Free accounts may own one community. Paid tiers remove the position limit and raise the community limit. Custom Discord bots and webhook logs are paid features.",
  ]},
  { title: "Tiers and durations", paragraphs: [
    "Keys are issued with a tier (PRO, ENTERPRISE, or LIFETIME) and an optional duration. A keyed duration starts when the key is redeemed. LIFETIME keys do not expire. Keys may have a redemption deadline and a maximum number of uses.",
  ]},
  { title: "Expiry", paragraphs: [
    "When a license expires, paid features are locked again. Your data, communities, applications, and settings are kept. You can renew by redeeming another key. Expired features are not deleted.",
  ]},
  { title: "Pricing, payment, and taxes", paragraphs: [
    "[PRICING AND PAYMENT TERMS TO BE INSERTED WHEN PAID LICENSES LAUNCH.] Prices may be shown exclusive or inclusive of applicable taxes. You are responsible for taxes that apply to your purchase, except where we are required to collect and remit them.",
  ]},
  { title: "Refunds", paragraphs: [
    "[REFUND POLICY TO BE INSERTED BEFORE PAID LICENSES LAUNCH. Consider how it interacts with consumer rights in your jurisdiction, including statutory cooling-off periods for digital goods.] Keys that have been redeemed are generally non-refundable unless required by law or approved by us in writing.",
  ]},
  { title: "Transfers and misuse", paragraphs: [
    "License keys are for the community or account they were redeemed for. Do not resell, share, or publicly post keys. We may revoke a key that has been obtained fraudulently, shared publicly, or used in breach of our Terms, and we will tell you when we do.",
  ]},
  { title: "Disputes and contact", paragraphs: [
    "If you have a billing question, email [CONTACT EMAIL] with your key ID or community name. These terms are part of our Terms of Service.",
  ]},
];

export default function BillingPolicyPage() {
  return (
    <LegalDocument
      title="Licenses, Billing & Refunds"
      subtitle="How licenses work, when they expire, and how refunds are handled"
      updated="October 28, 2026"
      sections={sections}
    />
  );
}
