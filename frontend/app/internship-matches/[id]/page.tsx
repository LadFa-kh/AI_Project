import { use } from "react";
import { InternshipDetailView } from "@/components/matches/internship-detail-view";

export default function InternshipMatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <InternshipDetailView internshipId={id} />;
}
