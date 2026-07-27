export type ScoreLevel = "basic" | "good" | "excellent";

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 85) return "excellent";
  if (score >= 60) return "good";
  return "basic";
}

export const SCORE_LEVEL_LABEL: Record<ScoreLevel, string> = {
  basic: "พื้นฐาน",
  good: "ดี",
  excellent: "ดีมาก",
};

export type SkillSummary = {
  skillName: string;
  level: string;
};

export type EvaluationResult = {
  overallScore: number;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  skillSummary: SkillSummary[];
};

// Mock data until backend evaluation is wired (see PROJECT_CONTEXT.md: POST /assessments response)
export const MOCK_EVALUATION_RESULT: EvaluationResult = {
  overallScore: 78,
  strengths: ["พื้นฐาน JavaScript แข็งแรง", "สื่อสารและทำงานร่วมกับทีมได้ดี"],
  gaps: ["ขาดประสบการณ์ SQL ขั้นสูง", "ยังไม่เคยใช้งาน React ในโปรเจกต์จริง"],
  recommendations: [
    "ฝึกทำโปรเจกต์ React ขนาดเล็กเพื่อสร้างพอร์ตโฟลิโอ",
    "ทบทวนพื้นฐาน SQL query และ database design",
  ],
  skillSummary: [
    { skillName: "JavaScript", level: "ดีมาก" },
    { skillName: "React", level: "ผ่านเกณฑ์" },
    { skillName: "SQL", level: "พอได้" },
    { skillName: "การสื่อสาร", level: "ดีเยี่ยม" },
  ],
};
