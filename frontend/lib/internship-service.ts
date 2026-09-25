// Internship history (API_CHANGES.md §5.6 B6).
// STUDENT : GET/POST /internships/me · PUT/DELETE /internships/me/{id}
// EMPLOYER: GET /employer/internships · PATCH /employer/internships/{id}
// ADMIN   : GET /admin/internships?status=&companyId=&page=&size=
// Responses are unwrapped defensively (envelope / bare / paginated).

import { apiFetch, unwrap, unwrapList } from "./api-client";

export type InternshipStatus = "APPLIED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "REJECTED";

export const INTERNSHIP_STATUS_LABEL: Record<InternshipStatus, string> = {
  APPLIED: "สมัครแล้ว",
  ACCEPTED: "ได้รับการตอบรับ",
  IN_PROGRESS: "กำลังฝึกงาน",
  COMPLETED: "ฝึกงานเสร็จสิ้น",
  CANCELLED: "ยกเลิก",
  REJECTED: "ไม่ผ่านการคัดเลือก",
};

export const INTERNSHIP_STATUSES = Object.keys(INTERNSHIP_STATUS_LABEL) as InternshipStatus[];

export type Internship = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail?: string | null;
  companyId: string | null;
  companyName: string;
  jobId?: string | null;
  positionName: string | null;
  startDate: string | null;
  endDate: string | null;
  status: InternshipStatus;
  supervisorName?: string | null;
  supervisorEmail?: string | null;
  studentNote?: string | null;
  companyNote?: string | null;
  createdAt?: string;
};

/** One of: { jobId } | { companyId, positionName } | { companyName, positionName, ... } */
export type InternshipCreateInput = {
  jobId?: string;
  companyId?: string;
  companyName?: string;
  positionName?: string;
  startDate?: string;
  endDate?: string;
  supervisorName?: string;
  supervisorEmail?: string;
  studentNote?: string;
};

export type InternshipUpdateInput = Partial<Omit<InternshipCreateInput, "jobId" | "companyId">> & {
  status?: InternshipStatus;
};

/** Company-side off-system rows (companyId = null) are fully student-managed (§5.6). */
export function isOffSystem(i: Internship): boolean {
  return !i.companyId;
}

export function canStudentDelete(i: Internship): boolean {
  return i.status === "APPLIED" || i.status === "CANCELLED";
}

// ---- STUDENT ----
export async function listMyInternships(): Promise<Internship[]> {
  return unwrapList<Internship>(await apiFetch<unknown>("/internships/me", { method: "GET" }));
}

export async function createMyInternship(input: InternshipCreateInput): Promise<Internship> {
  const res = await apiFetch<unknown>("/internships/me", { method: "POST", body: JSON.stringify(input) });
  return unwrap<Internship>(res);
}

export async function updateMyInternship(id: string, input: InternshipUpdateInput): Promise<Internship> {
  const res = await apiFetch<unknown>(`/internships/me/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return unwrap<Internship>(res);
}

export async function deleteMyInternship(id: string): Promise<void> {
  await apiFetch<unknown>(`/internships/me/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ---- EMPLOYER ----
export async function listCompanyInternships(): Promise<Internship[]> {
  return unwrapList<Internship>(await apiFetch<unknown>("/employer/internships", { method: "GET" }));
}

export async function updateCompanyInternship(
  id: string,
  input: { status: InternshipStatus; companyNote?: string }
): Promise<Internship> {
  const res = await apiFetch<unknown>(`/employer/internships/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return unwrap<Internship>(res);
}

// ---- ADMIN ----
export type Paged<T> = { content: T[]; page: number; size: number; totalElements: number; totalPages: number };

export async function listAllInternships(params: { status?: string; page?: number; size?: number } = {}): Promise<Paged<Internship>> {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  q.set("page", String(params.page ?? 0));
  q.set("size", String(params.size ?? 20));
  const data = unwrap<Paged<Internship> | Internship[]>(await apiFetch<unknown>(`/admin/internships?${q}`, { method: "GET" }));
  if (Array.isArray(data)) return { content: data, page: 0, size: data.length, totalElements: data.length, totalPages: 1 };
  return data;
}
