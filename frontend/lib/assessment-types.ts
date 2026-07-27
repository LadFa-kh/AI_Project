export type SkillLevel = "basic" | "meets" | "strong" | "excellent";

export const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: "basic", label: "พอได้" },
  { value: "meets", label: "ผ่านเกณฑ์" },
  { value: "strong", label: "ดีมาก" },
  { value: "excellent", label: "ดีเยี่ยม" },
];

export type Skill = {
  skillName: string;
};

export type SkillAnswers = Record<string, SkillLevel>;

// Mock data until backend resume-extraction is wired (see PROJECT_CONTEXT.md: POST /resumes)
export const MOCK_SKILLS: Skill[] = [
  { skillName: "JavaScript" },
  { skillName: "React" },
  { skillName: "SQL" },
  { skillName: "การสื่อสาร" },
  { skillName: "การทำงานเป็นทีม" },
];
