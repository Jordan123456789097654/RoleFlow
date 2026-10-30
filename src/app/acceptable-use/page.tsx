import LegalDocument from "@/components/legal/LegalDocument";
import { getPolicy } from "@/lib/policies";

export const dynamic = "force-dynamic";

export default async function AcceptableUsePage() {
  const policy = await getPolicy("acceptable-use");
  return (
    <LegalDocument
      title={policy.title}
      subtitle={policy.subtitle}
      updated={policy.updated}
      sections={policy.sections}
    />
  );
}
