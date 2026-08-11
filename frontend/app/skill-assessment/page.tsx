import type { Metadata } from "next";
import { SkillAssessmentFlow } from "@/components/assessment/skill-assessment-flow";

export const metadata: Metadata = {
  title: "Skill assessment",
};

export default function SkillAssessmentPage() {
  return <SkillAssessmentFlow />;
}
