import type { Metadata } from "next";
import { InternshipMatchesFlow } from "@/components/matches/internship-matches-flow";

export const metadata: Metadata = {
  title: "ตำแหน่งฝึกงานที่แนะนำ",
};

export default function InternshipMatchesPage() {
  return <InternshipMatchesFlow />;
}
