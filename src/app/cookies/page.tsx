import LegalDocument from "@/components/legal/LegalDocument";
import { getPolicy } from "@/lib/policies";

export const dynamic = "force-dynamic";

export default async function CookiePolicyPage() {
  const policy = await getPolicy("cookies");
  return (
    <LegalDocument
      title={policy.title}
      subtitle={policy.subtitle}
      updated={policy.updated}
      sections={policy.sections}
    />
  );
}
