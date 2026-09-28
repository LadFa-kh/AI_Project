import type { Metadata } from "next";
import { AssessmentHistoryPage } from "@/components/assessment-history/assessment-history-page";

export const metadata: Metadata = {
  title: "ประวัติการประเมิน — ResuMate",
};

export default function Page() {
  return <AssessmentHistoryPage />;
}
