export type ScoreLevel = "developing" | "good" | "excellent";

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 85) return "excellent";
  if (score >= 60) return "good";
  return "developing";
}

export const SCORE_LEVEL_LABEL: Record<ScoreLevel, string> = {
  developing: "Developing",
  good: "Good",
  excellent: "Excellent",
};

// Maps to a CSS custom property consumed by .scoreRing / .scoreBadge in nocturne.module.css
export const SCORE_LEVEL_COLOR: Record<ScoreLevel, string> = {
  developing: "#f0a256",
  good: "#9184d9",
  excellent: "#7fd88f",
};

export type EvaluationResult = {
  assessmentId: string;
  overallScore: number;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
};

// Mock data until backend evaluation is wired
// GET response per PROJECT_CONTEXT.md: { assessmentId, overallScore, recommendations, strengths, gaps }
export const MOCK_EVALUATION_RESULT: EvaluationResult = {
  assessmentId: "mock-assessment-1",
  overallScore: 78,
  strengths: [
    "Strong grasp of JavaScript fundamentals",
    "Clear, collaborative communication style",
  ],
  gaps: [
    "Limited hands-on experience with advanced SQL",
    "Hasn't yet used React in a production-scale project",
  ],
  recommendations: [
    "Build a small React project to strengthen your portfolio",
    "Review SQL query fundamentals and basic database design",
  ],
};
