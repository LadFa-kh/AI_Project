// Workplace listing API call. Endpoint confirmed against backend Swagger
// (workplace-controller):
// GET /workplaces
// -> bare array (no ApiResponse wrapper, same style as /matching/recommendations),
//    ALL workplaces regardless of any user's matching/assessment status:
//    { id, companyName, jobType, positionName, requiredSkills: string[] }
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
};

export async function getAllWorkplaces(): Promise<Workplace[]> {
  return apiFetch<Workplace[]>("/workplaces", { method: "GET" });
}
