// Hands off the resume-upload result (resumeId + generated questions) to the
// skill-assessment page via sessionStorage — tab-scoped, cleared on close,
// no backend "start assessment" endpoint exists to fetch this from instead.

import type { ResumeUploadQuestion } from "./resume-service";

const STORAGE_KEY = "resume-upload-result";

export type StoredResumeUpload = {
  resumeId: string;
  questions: ResumeUploadQuestion[];
  /** Carried over from the upload-resume form's "field of interest" input —
   *  required by POST /assessments/submit, not accepted by /resumes/upload. */
  desiredRoleName?: string;
};

export function writeResumeUploadResult(result: StoredResumeUpload) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch {
    // Storage unavailable (private browsing, quota) — skill-assessment page
    // will just show its empty state.
  }
}

export function readResumeUploadResult(): StoredResumeUpload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredResumeUpload>;
    if (!parsed.resumeId || !Array.isArray(parsed.questions)) return null;
    return parsed as StoredResumeUpload;
  } catch {
    return null;
  }
}

export function clearResumeUploadResult() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
