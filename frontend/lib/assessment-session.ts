// Hands off the assessment-submit result to the evaluation-result page via
// sessionStorage — same pattern as resume-session.ts. No backend "fetch my
// last result" endpoint exists, and a resume can only be submitted once, so
// this is the only way evaluation-result can show the score after the user
// navigates there from skill-assessment.

import type { AssessmentSubmitResult } from "./assessment-service";

const STORAGE_KEY = "assessment-submit-result";

export function writeAssessmentResult(result: AssessmentSubmitResult) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch {
    // Storage unavailable — evaluation-result page will show its empty state.
  }
}

export function readAssessmentResult(): AssessmentSubmitResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AssessmentSubmitResult>;
    if (
      !parsed.resumeId ||
      typeof parsed.resumeScore !== "number" ||
      typeof parsed.assessmentScore !== "number" ||
      typeof parsed.finalScore !== "number" ||
      !Array.isArray(parsed.missingSkills) ||
      typeof parsed.recommendationSummary !== "string" ||
      !Array.isArray(parsed.recommendationItems)
    ) {
      return null;
    }
    return parsed as AssessmentSubmitResult;
  } catch {
    return null;
  }
}

export function clearAssessmentResult() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
