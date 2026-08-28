// Hands off the loaded /workplaces list ("ทั้งหมด" filter) to the detail
// page via sessionStorage — same pattern and same reason as match-session.ts
// (no backend "get one job by id" endpoint exists). Kept as a separate store
// from match-session.ts rather than merged, since the two sources really are
// different API calls with different shapes (Workplace has no score); the
// detail page checks both stores by jobId.

import type { Workplace } from "./workplace-service";

const STORAGE_KEY = "internship-workplaces-list";

export function writeWorkplaceList(workplaces: Workplace[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(workplaces));
  } catch {
    // Storage unavailable — detail page will show its not-found state.
  }
}

export function readWorkplaceById(id: string): Workplace | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const workplace = parsed.find(
      (item): item is Workplace => !!item && typeof item === "object" && (item as Workplace).id === id
    );
    return workplace ?? null;
  } catch {
    return null;
  }
}
