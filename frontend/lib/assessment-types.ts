// Questions come from the resume-upload response (resume-controller
// /resumes/upload -> questions[]), not a separate assessment endpoint —
// there is no backend "submit assessment" API yet, so answers are kept
// client-side only for now.

export type AssessmentQuestion = {
  id: string;
  question: string;
  options: string[];
};

/** Keyed by question id -> the option string the user picked. */
export type AssessmentAnswers = Record<string, string>;
