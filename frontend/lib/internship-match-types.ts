// Types scoped to /internship-matches. Two sources feed this page's cards:
// - GET /matching/recommendations (matching-service.ts): per-user fit,
//   max 5, sorted by score — used by the "ตรงกับคุณ" filter.
// - GET /workplaces (workplace-service.ts): every listed job, no scoring —
//   used by the "ทั้งหมด" filter.
//
// DisplayJob is the shape MatchCard actually renders: matching-only fields
// (userFinalScore/matchedSkills/missingSkills) are optional since a card
// built from /workplaces alone won't have them. When a job appears in both
// sources, the view merges the matching fields in (see
// internship-matches-view.tsx) so score/skill chips still show in "ทั้งหมด".

export type { InternshipMatch } from "./matching-service";
export type { Workplace } from "./workplace-service";

export type DisplayJob = {
  jobId: string;
  companyName: string;
  positionName: string;
  jobType?: string;
  requiredSkills?: string[];
  userFinalScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
};
