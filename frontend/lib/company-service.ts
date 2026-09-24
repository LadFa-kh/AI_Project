// Public company profile (API_CHANGES.md §5.4 B4) — no login required.
// GET /companies/{id}       -> { status, message, data: Company }  (404 when SUSPENDED)
// GET /companies/{id}/jobs  -> OPEN jobs only, same shape as GET /workplaces.
//   Handled defensively: bare array, envelope, or paginated { content }.

import { apiFetch } from "./api-client";
import type { Workplace } from "./workplace-service";

export type Company = {
  id: string;
  nameTh: string;
  nameEn: string | null;
  industry: string | null;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  province: string | null;
  status: string;
  jobCount: number;
};

function unwrap<T>(res: unknown): T {
  if (res && typeof res === "object" && "data" in res && "status" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export async function getCompanyById(id: string): Promise<Company> {
  const res = await apiFetch<unknown>(`/companies/${encodeURIComponent(id)}`, { method: "GET" });
  return unwrap<Company>(res);
}

export async function getCompanyJobs(id: string): Promise<Workplace[]> {
  const res = await apiFetch<unknown>(`/companies/${encodeURIComponent(id)}/jobs`, { method: "GET" });
  const data = unwrap<Workplace[] | { content?: Workplace[] } | null>(res);
  if (Array.isArray(data)) return data;
  return data?.content ?? [];
}
