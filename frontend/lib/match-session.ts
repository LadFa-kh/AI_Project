// Hands off the loaded internship-matches list to the detail page via
// sessionStorage. No backend "get one job by id" endpoint exists (see
// matching-service.ts) — GET /matching/recommendations only returns the
// list, so the detail page looks up by jobId from whatever list was last
// loaded in this tab rather than fetching separately.

import type { InternshipMatch } from "./matching-service";

const STORAGE_KEY = "internship-matches-list";

export function writeMatchList(matches: InternshipMatch[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
  } catch {
    // Storage unavailable — detail page will show its not-found state.
  }
}

export function readMatchById(jobId: string): InternshipMatch | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const match = parsed.find(
      (item): item is InternshipMatch =>
        !!item && typeof item === "object" && (item as InternshipMatch).jobId === jobId
    );
    return match ?? null;
  } catch {
    return null;
  }
}
