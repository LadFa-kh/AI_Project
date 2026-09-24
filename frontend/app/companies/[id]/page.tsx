import { use } from "react";
import { CompanyProfileView } from "@/components/companies/company-profile-view";

export default function CompanyProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <CompanyProfileView companyId={id} />;
}
