// ADMIN endpoints from round B4/B6/B7/B8 (API_CHANGES.md §5.4, §5.7, §5.8).
// Kept separate from admin-service.ts (the original dashboard/users/resumes/jobs API).

import { apiFetch, apiUrl, unwrap } from "./api-client";
import type { Company } from "./company-service";

export type Paged<T> = { content: T[]; page: number; size: number; totalElements: number; totalPages: number };

function toPaged<T>(res: unknown): Paged<T> {
  const data = unwrap<Paged<T> | T[] | null>(res);
  if (Array.isArray(data)) return { content: data, page: 0, size: data.length, totalElements: data.length, totalPages: 1 };
  if (data && Array.isArray(data.content)) return data;
  return { content: [], page: 0, size: 0, totalElements: 0, totalPages: 0 };
}

function qs(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

// ===== Companies (B4) =====
export type AdminCompany = Company & { taxId?: string | null; createdAt?: string };
export type CompanyStatus = "ACTIVE" | "PENDING" | "SUSPENDED";

export async function listAdminCompanies(params: { q?: string; status?: string; page?: number; size?: number }): Promise<Paged<AdminCompany>> {
  return toPaged<AdminCompany>(await apiFetch<unknown>(`/admin/companies${qs({ ...params, page: params.page ?? 0, size: params.size ?? 20 })}`, { method: "GET" }));
}

export async function setCompanyStatus(id: string, status: CompanyStatus, reason?: string): Promise<void> {
  await apiFetch<unknown>(`/admin/companies/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify(reason ? { status, reason } : { status }),
  });
}

// ===== Import (B7) =====
export type ImportError = { row: number; field: string | null; message: string };
export type ImportResult = {
  logId: string;
  dryRun: boolean;
  totalRows: number;
  created: number;
  updated: number;
  skipped: number;
  errors: ImportError[];
};

export const IMPORT_TEMPLATE_URL = apiUrl("/admin/companies/import/template");

export async function importCompanies(file: File, dryRun: boolean): Promise<{ message: string; result: ImportResult }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiFetch<unknown>(`/admin/companies/import?dryRun=${dryRun}`, { method: "POST", body: fd });
  const message = res && typeof res === "object" && "message" in res ? String((res as { message: unknown }).message ?? "") : "";
  return { message, result: unwrap<ImportResult>(res) };
}

/** Shape not documented beyond "history" — rendered generically. */
export async function listImports(page = 0, size = 20): Promise<Paged<Record<string, unknown>>> {
  return toPaged<Record<string, unknown>>(await apiFetch<unknown>(`/admin/imports${qs({ page, size })}`, { method: "GET" }));
}

// ===== Cost per action (§5.13) — GET /admin/usage/cost?from=&to= =====
export type CostRow = {
  name: string;
  samples: number;
  model?: string | null;
  avgLlmCalls?: number | null;
  avgInputTokens: number;
  avgOutputTokens: number;
  avgCost: number;
};
export type UsageCost = {
  pricePer1M: { input: number; output: number; currency: string };
  byAction: CostRow[];
  byPythonEndpoint: CostRow[];
};

export async function getUsageCost(from?: string, to?: string): Promise<UsageCost> {
  return unwrap<UsageCost>(await apiFetch<unknown>(`/admin/usage/cost${qs({ from, to })}`, { method: "GET" }));
}

// ===== Usage (B8) — shapes not documented; rendered generically =====
export async function getUsageSummary(from?: string, to?: string): Promise<unknown> {
  return unwrap<unknown>(await apiFetch<unknown>(`/admin/usage/summary${qs({ from, to })}`, { method: "GET" }));
}

export async function listUsage(params: { userId?: string; action?: string; from?: string; to?: string; page?: number; size?: number }): Promise<Paged<Record<string, unknown>>> {
  return toPaged<Record<string, unknown>>(
    await apiFetch<unknown>(`/admin/usage${qs({ ...params, page: params.page ?? 0, size: params.size ?? 50 })}`, { method: "GET" })
  );
}


