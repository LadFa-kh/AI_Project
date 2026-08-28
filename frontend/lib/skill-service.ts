// Skill taxonomy search. Endpoint confirmed against backend Swagger
// (skill-search-controller):
// GET /skills/search?searchSkill={string}  (optional — omitted returns all ~1358 skills)
// -> string[]
//
// Used for the autocomplete/dropdown on the "field of interest" input —
// backend has no dedicated "job role" list, so we search the skill taxonomy
// instead (matches the README's documented use case for this endpoint).

import { apiFetch } from "./api-client";

export async function searchSkills(query?: string): Promise<string[]> {
  const trimmed = query?.trim();
  const path = trimmed
    ? `/skills/search?searchSkill=${encodeURIComponent(trimmed)}`
    : "/skills/search";
  return apiFetch<string[]>(path, { method: "GET" });
}
