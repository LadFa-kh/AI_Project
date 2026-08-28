import type { Metadata } from "next";
import { EmployerJobsFlow } from "@/components/employer/employer-jobs-flow";
import { EmployerGuard } from "@/components/employer/employer-guard";

export const metadata: Metadata = {
  title: "ประกาศงานของฉัน — ResuMate",
};

export default function EmployerJobsPage() {
  return (
    <EmployerGuard>
      <EmployerJobsFlow />
    </EmployerGuard>
  );
}
