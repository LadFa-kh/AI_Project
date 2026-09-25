// Public company profile (API_CHANGES.md §5.4 B4) — no login required.
// GET /companies/{id}       -> { status, message, data: Company }  (404 when SUSPENDED)
// GET /companies/{id}/jobs  -> OPEN jobs only, same shape as GET /workplaces.
//   Handled defensively: bare array, envelope, or paginated { content }.

import { apiFetch, unwrap, unwrapList } from "./api-client";
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

export async function getCompanyById(id: string): Promise<Company> {
  const res = await apiFetch<unknown>(`/companies/${encodeURIComponent(id)}`, { method: "GET" });
  return unwrap<Company>(res);
}

export async function getCompanyJobs(id: string): Promise<Workplace[]> {
  const res = await apiFetch<unknown>(`/companies/${encodeURIComponent(id)}/jobs`, { method: "GET" });
  return unwrapList<Workplace>(res);
}

// ===== EMPLOYER — own company (GET/PUT /companies/me) =====

export type CompanyInput = {
  nameTh: string;
  nameEn: string;
  industry: string;
  description: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  province: string;
  logoUrl: string;
};

export async function getMyCompany(): Promise<Company> {
  const res = await apiFetch<unknown>("/companies/me", { method: "GET" });
  return unwrap<Company>(res);
}

/** Send only the fields that changed (API_CHANGES.md §5.4). */
export async function updateMyCompany(input: Partial<CompanyInput>): Promise<Company> {
  const res = await apiFetch<unknown>("/companies/me", {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return unwrap<Company>(res);
}
