import type { Metadata } from "next";
import { StudentInternshipsPage } from "@/components/internships/student-internships-page";

export const metadata: Metadata = {
  title: "ประวัติฝึกงาน — ResuMate",
};

export default function InternshipsPage() {
  return <StudentInternshipsPage />;
}
