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

/**
 * Downloads the CSV template. Must go through fetch → blob (not .text()) so the
 * UTF-8 BOM survives and Excel shows Thai correctly (FRONTEND_REQUESTS รอบ 4 ข้อ 3.4).
 */
export async function downloadImportTemplate(): Promise<void> {
  const res = await fetch(apiUrl("/admin/companies/import/template"), { credentials: "include" });
  if (!res.ok) throw new Error("ดาวน์โหลด template ไม่สำเร็จ");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "companies-template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importCompanies(file: File, dryRun: boolean): Promise<{ message: string; result: ImportResult }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiFetch<unknown>(`/admin/companies/import?dryRun=${dryRun}`, { method: "POST", body: fd });
  const message = res && typeof res === "object" && "message" in res ? String((res as { message: unknown }).message ?? "") : "";
  return { message, result: unwrap<ImportResult>(res) };
}

// Shapes confirmed in FRONTEND_REQUESTS รอบ 4 ข้อ 2.8–2.9.
export type ImportLog = {
  id: string;
  type: string;
  fileName: string;
  dryRun: boolean;
  totalRows: number;
  created: number;
  updated: number;
  skipped: number;
  errorCount: number;
  /** JSON string of ImportError[] — parse with parseImportErrors(). */
  errorsJson?: string | null;
  importedBy?: string | null;
  createdAt: string;
};

export function parseImportErrors(json: string | null | undefined): ImportError[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? (v as ImportError[]) : [];
  } catch {
    return [];
  }
}

export async function listImports(page = 0, size = 20): Promise<Paged<ImportLog>> {
  return toPaged<ImportLog>(await apiFetch<unknown>(`/admin/imports${qs({ type: "COMPANY", page, size })}`, { method: "GET" }));
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

// ===== Usage (B8) =====
export type UsageSummaryRow = { action: string; total: number; success: number; creditsUsed: number };
export type UsageLogRow = {
  id: string;
  userId: string | null;
  email: string | null;
  action: string;
  success: boolean;
  creditsUsed: number;
  durationMs: number | null;
  detail: string | null;
  createdAt: string;
};

export async function getUsageSummary(from?: string, to?: string): Promise<UsageSummaryRow[]> {
  const data = unwrap<UsageSummaryRow[] | null>(await apiFetch<unknown>(`/admin/usage/summary${qs({ from, to })}`, { method: "GET" }));
  return Array.isArray(data) ? data : [];
}

export async function listUsage(params: { userId?: string; action?: string; from?: string; to?: string; page?: number; size?: number }): Promise<Paged<UsageLogRow>> {
  return toPaged<UsageLogRow>(
    await apiFetch<unknown>(`/admin/usage${qs({ ...params, page: params.page ?? 0, size: params.size ?? 50 })}`, { method: "GET" })
  );
}


