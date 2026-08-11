import type { Metadata } from "next";
import { InternshipMatchesView } from "@/components/matches/internship-matches-view";

export const metadata: Metadata = {
  title: "Your internship matches",
};

export default function InternshipMatchesPage() {
  return <InternshipMatchesView />;
}
