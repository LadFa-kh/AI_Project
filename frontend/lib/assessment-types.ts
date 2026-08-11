export type SkillLevel = "basic" | "meets" | "strong" | "excellent";

export const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: "basic", label: "Basic" },
  { value: "meets", label: "Meets Expectations" },
  { value: "strong", label: "Strong" },
  { value: "excellent", label: "Excellent" },
];

export type Skill = {
  skillName: string;
};

export type SkillAnswers = Record<string, SkillLevel>;

// Mock data until backend resume-extraction is wired (see PROJECT_CONTEXT.md: POST /resumes)
export const MOCK_SKILLS: Skill[] = [
  { skillName: "React" },
  { skillName: "JavaScript" },
  { skillName: "SQL" },
  { skillName: "Project Management" },
  { skillName: "Communication" },
];
