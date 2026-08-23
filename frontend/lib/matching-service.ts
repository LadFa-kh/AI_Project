// Internship matching API call. Endpoint confirmed against backend README
// (matching-controller):
// GET /matching/recommendations?resumeId={uuid}
// -> array (NOT wrapped in ApiResponse, unlike auth endpoints), max 5 items,
//    sorted by fit descending.
//
// userId is no longer sent — backend derives the user from the httpOnly
// accessToken cookie and has fully removed the old userId-based fallback,
// so this only works when the frontend is deployed same-site with the
// backend (see auth-context.tsx). Requires login (403 if not).
//
// KNOWN BACKEND BUG (README §6): MatchingController catches all exceptions
// itself and returns a bodyless 500 for every failure case — including the
// normal case where the resume hasn't finished its assessment yet. There is
// currently no way to tell these apart from the response alone. Callers
// should treat any failure here as "matches aren't available right now,
// possibly because the assessment isn't done" rather than a hard error.

import { apiFetch } from "./api-client";

export type InternshipMatch = {
  jobId: string;
  companyName: string;
  positionName: string;
  userFinalScore: number;
  matchedSkills: string[];
  missingSkills: string[];
};

export async function getMatchingRecommendations(resumeId: string): Promise<InternshipMatch[]> {
  const params = new URLSearchParams({ resumeId });
  return apiFetch<InternshipMatch[]>(`/matching/recommendations?${params.toString()}`, {
    method: "GET",
  });
}
