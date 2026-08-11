import type { InternshipMatchSummary } from "./internship-match-types";
import { MOCK_MATCH_SUMMARIES } from "./internship-match-types";

export type WorkType = "Remote" | "On-site" | "Hybrid";

// Fields beyond { internshipId, title, company, matchScore, requiredSkills } are not yet in the
// documented PROJECT_CONTEXT.md contract — see backend TODO in the component for the detail endpoint shape.
export type InternshipDetail = InternshipMatchSummary & {
  description: string;
  location?: string;
  workType?: WorkType;
  duration?: string;
  matchedSkills: string[];
  externalUrl: string;
};

// Mock data until backend detail endpoint is wired
const MOCK_DETAILS: Record<string, Omit<InternshipDetail, keyof InternshipMatchSummary>> = {
  "1": {
    description:
      "Join our product engineering team to build and ship features used by thousands of students every week. You'll pair with senior engineers, contribute to our design system, and help shape how we build accessible, performant interfaces.",
    location: "Bangkok, Thailand",
    workType: "Hybrid",
    duration: "4 months",
    matchedSkills: ["React", "JavaScript"],
    externalUrl: "https://example.com/careers/frontend-developer-intern",
  },
  "2": {
    description:
      "Work alongside our analytics team to turn raw product data into insights that guide company decisions. You'll build dashboards, write queries, and present findings to stakeholders across the business.",
    location: "Chiang Mai, Thailand",
    workType: "Remote",
    matchedSkills: ["Communication"],
    externalUrl: "https://example.com/careers/data-analyst-intern",
  },
  "3": {
    description:
      "Help build the next generation of our core platform. You'll work in a small, fast-moving team covering the full stack, with mentorship from experienced engineers throughout your internship.",
    location: "Bangkok, Thailand",
    workType: "On-site",
    duration: "6 months",
    matchedSkills: ["JavaScript", "Teamwork"],
    externalUrl: "https://example.com/careers/software-engineer-intern",
  },
  "4": {
    description:
      "Support our product team by analyzing user behavior, running experiments, and translating data into actionable recommendations for the roadmap.",
    workType: "Remote",
    matchedSkills: [],
    externalUrl: "https://example.com/careers/product-analyst-intern",
  },
};

export function getMockInternshipDetail(internshipId: string): InternshipDetail | null {
  const summary = MOCK_MATCH_SUMMARIES.find((m) => m.internshipId === internshipId);
  const extra = MOCK_DETAILS[internshipId];
  if (!summary || !extra) return null;
  return { ...summary, ...extra };
}
