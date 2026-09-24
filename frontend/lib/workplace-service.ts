// Workplace listing API call. Endpoint confirmed against backend source
// (WorkplaceController / JobDescriptionResponseDto):
// GET /workplaces
// -> bare array (no ApiResponse wrapper, same style as /matching/recommendations),
//    ALL workplaces regardless of any user's matching/assessment status:
//    { id, companyName, jobType, positionName, requiredSkills: string[],
//      jobDescription, duration, salary, contactLink }
// GET /workplaces/{id}
// -> single job by id, same shape as above (also exists on the backend,
//    contrary to an earlier comment here claiming no per-job endpoint).
//
// Unlike GET /matching/recommendations, this has no score/matchedSkills/
// missingSkills — it's the raw job listing, not a per-user recommendation.

import { apiFetch } from "./api-client";

export type Workplace = {
  id: string;
  companyName: string;
  jobType: string;
  positionName: string;
  requiredSkills: string[];
  jobDescription?: string;
  duration?: string;
  salary?: string;
  contactLink?: string;
  // B4 (API_CHANGES.md §5.4) — link to /companies/{companyId}; absent on older rows.
  companyId?: string | null;
  companyLogoUrl?: string | null;
};

export async function getAllWorkplaces(): Promise<Workplace[]> {
  return apiFetch<Workplace[]>("/workplaces", { method: "GET" });
}

export async function getWorkplaceById(id: string): Promise<Workplace> {
  return apiFetch<Workplace>(`/workplaces/${id}`, { method: "GET" });
}
