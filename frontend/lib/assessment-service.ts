// Assessment submit API call. Endpoint confirmed against backend README
// (assessment-controller):
// POST /assessments/submit
// body: { resumeId, desiredRoleName, answers: [{questionId, selectedScore: 1-4}] }
// -> { resumeId, resumeScore, assessmentScore, finalScore, missingSkills, recommendation }
//
// userId is no longer sent — backend derives the user from the httpOnly
// accessToken cookie and has fully removed the old userId-based fallback,
// so this only works when the frontend is deployed same-site with the
// backend (see auth-context.tsx). Requires login (403 if not).
//
// Backend rules this call must satisfy (see README):
// - answers must cover every questionId from the upload-resume response, no more/less/dupes
// - selectedScore must be an integer 1-4
// - a resume can only be submitted once — resubmitting is rejected
//
// scoreBreakdown/scoreExplanation added per API_CHANGES.md §1 — explains
// where resumeScore/assessmentScore/finalScore actually come from. Optional
// because a result saved to sessionStorage before this change won't have
// them (see result-session's read path).

import { apiFetch } from "./api-client";
import type { AssessmentAnswers, AssessmentQuestion } from "./assessment-types";

// Mirrors scoreBreakdown exactly (see API_CHANGES.md §1) — every number here
// is what the backend actually used to compute resumeScore/assessmentScore/
// finalScore, so the UI should always display these instead of recomputing.
export type ScoreBreakdown = {
  // ส่วนที่ 1 คะแนนเรซูเม่
  totalResumeSkills: number;
  totalStandardSkills: number;
  matchedSkills: string[];
  unmatchedSkills: string[];
  precisionScore: number;
  penaltyFactor: number;
  resumeScore: number;
  resumeScoreReason: string;

  // ส่วนที่ 2 คะแนนแบบประเมินตนเอง
  answeredQuestions: number;
  maxScorePerQuestion: number;
  totalScoreObtained: number;
  maxPossibleScore: number;
  assessmentScore: number;

  // ส่วนที่ 3 การถ่วงน้ำหนักรวม
  resumeWeight: number;
  assessmentWeight: number;
  resumeContribution: number;
  assessmentContribution: number;
  finalScore: number;

  roleUsedForMatching: string;
  roleInferredByAi: boolean;

  // B2 (API_CHANGES.md §5.2) — how each resume skill was matched.
  matchMethod?: "SEMANTIC" | "WORD_FALLBACK";
  matchDetails?: SkillMatchDetail[];
};

export type SkillMatchDetail = {
  resumeSkill: string;
  standardSkill: string | null;
  method: "WORD" | "SEMANTIC" | "NONE";
  confidence: number | null;
};

// B1 (API_CHANGES.md §5.1) — only present when the user left
// desiredRoleName empty. 1–4 items, sorted by percent desc, integer
// percents that always sum to 100 (computed by the backend — never
// recompute or re-normalize client-side).
export type CareerMatch = {
  roleName: string;
  percent: number;
  matchedSkills: string[];
  /** ≤ 10 items, most widely used in the market first. */
  missingSkills: string[];
};

export type AssessmentSubmitResult = {
  resumeId: string;
  resumeScore: number;
  assessmentScore: number;
  finalScore: number;
  missingSkills: string[];
  // Backend response shape as of the current deployment: a single summary
  // paragraph plus a list of actionable items. (Older/README-documented
  // shape had one `recommendation: string` field — no longer sent.)
  recommendationSummary: string;
  recommendationItems: string[];

  // New per API_CHANGES.md §1 — optional since a result saved to
  // sessionStorage before this change won't have them.
  scoreBreakdown?: ScoreBreakdown;
  scoreExplanation?: string;

  careerMatches?: CareerMatch[];
};

// Each option is prefixed like "1. พอใช้" / "2. มาตรฐาน" — the leading
// digit is the score. Falls back to the option's position in the list
// (1-indexed) if the prefix is ever missing, so this doesn't silently break
// if backend changes the option text formatting.
function optionToScore(option: string, options: string[]): number {
  const match = option.match(/^(\d+)/);
  if (match) return Number(match[1]);
  const index = options.indexOf(option);
  return index >= 0 ? index + 1 : 1;
}

export async function submitAssessment(
  resumeId: string,
  desiredRoleName: string,
  questions: AssessmentQuestion[],
  answers: AssessmentAnswers
): Promise<AssessmentSubmitResult> {
  const payload = {
    resumeId,
    desiredRoleName,
    answers: questions.map((q) => ({
      questionId: q.id,
      selectedScore: optionToScore(answers[q.id], q.options),
    })),
  };

  return apiFetch<AssessmentSubmitResult>("/assessments/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
