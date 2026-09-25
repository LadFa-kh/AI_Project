import type { Metadata } from "next";
import { InternshipMatchesFlow } from "@/components/matches/internship-matches-flow";

// Public job board: every OPEN internship, no login / resume / admin needed.
export const metadata: Metadata = {
  title: "ตำแหน่งฝึกงานที่เปิดรับทั้งหมด — ResuMate",
};

export default function JobsPage() {
  return <InternshipMatchesFlow variant="browse" />;
}
