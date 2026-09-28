// Hands off the assessment-submit result to the evaluation-result page via
// sessionStorage (fast path right after submitting). When it's missing — new
// tab, another device — pages fall back to GET /assessments/me/latest
// (API_CHANGES.md §5.14).

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
