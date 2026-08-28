// Score-level helpers used by ScoreBadge — thresholds apply to any of the
// three 0-100 scores the backend returns (resumeScore/assessmentScore/finalScore).
export type ScoreLevel = "developing" | "good" | "excellent";

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 85) return "excellent";
  if (score >= 60) return "good";
  return "developing";
}

export const SCORE_LEVEL_LABEL: Record<ScoreLevel, string> = {
  developing: "กำลังพัฒนา",
  good: "ดี",
  excellent: "ยอดเยี่ยม",
};

// Maps to a CSS custom property consumed by .scoreRing / .scoreBadge in nocturne.module.css
export const SCORE_LEVEL_COLOR: Record<ScoreLevel, string> = {
  developing: "#f0a256",
  good: "#9184d9",
  excellent: "#7fd88f",
};

// Matches POST /assessments/submit's response exactly (see README §5) —
// this is also what AssessmentSubmitResult in assessment-service.ts is,
// re-exported here under the page-facing name evaluation-result uses.
export type { AssessmentSubmitResult as EvaluationResult } from "./assessment-service";
