import LegalDocument from "@/components/legal/LegalDocument";
import { getPolicy } from "@/lib/policies";

export const dynamic = "force-dynamic";

export default async function TermsOfServicePage() {
  const policy = await getPolicy("terms");
  return (
    <LegalDocument
      title={policy.title}
      subtitle={policy.subtitle}
      updated={policy.updated}
      sections={policy.sections}
    />
  );
}
