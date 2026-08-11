// Types scoped to /internship-matches, matching the PROJECT_CONTEXT.md contract exactly
// (no invented fields): GET /internships/matches?assessmentId=<id>
// -> { matches: [{ internshipId, title, company, matchScore, requiredSkills }], total }

export type InternshipMatchSummary = {
  internshipId: string;
  title: string;
  company: string;
  matchScore: number;
  requiredSkills: string[];
};

export type MatchSortOption = "matchScore" | "companyAz";

export const MATCH_SORT_OPTIONS: { value: MatchSortOption; label: string }[] = [
  { value: "matchScore", label: "Best match" },
  { value: "companyAz", label: "Company A–Z" },
];

// Mock data until backend is wired
export const MOCK_MATCH_SUMMARIES: InternshipMatchSummary[] = [
  {
    internshipId: "1",
    title: "Frontend Developer Intern",
    company: "Northlight Technologies",
    matchScore: 92,
    requiredSkills: ["React", "JavaScript", "CSS"],
  },
  {
    internshipId: "2",
    title: "Data Analyst Intern",
    company: "Beacon Data Insights",
    matchScore: 81,
    requiredSkills: ["SQL", "Excel", "Communication"],
  },
  {
    internshipId: "3",
    title: "Software Engineer Intern",
    company: "Coral Coding Solutions",
    matchScore: 75,
    requiredSkills: ["JavaScript", "SQL", "Teamwork"],
  },
  {
    internshipId: "4",
    title: "Product Analyst Intern",
    company: "Aster Analytics",
    matchScore: 68,
    requiredSkills: ["SQL", "Project Management"],
  },
];
