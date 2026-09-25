// Admin API calls. Endpoints confirmed against backend README_Admin_API.md
// (Swagger-derived, 13 endpoints across 4 controllers). All endpoints
// require an ADMIN-role session — apiFetch already sends the httpOnly
// accessToken cookie via credentials: 'include' (see api-client.ts), so no
// extra auth wiring is needed here beyond AdminGuard checking user.role.
//
// IMPORTANT — response shapes here are raw JSON (arrays/objects), NOT
// wrapped in the { status, message, data } envelope that /auth/* uses.
//
// No pagination/sorting on any list endpoint — backend returns everything
// in one call and does not guarantee stable ordering. Sort client-side.

import { apiFetch } from "./api-client";

// ===== 1. Dashboard =====

export type AdminDashboardStats = {
  totalUsers: number;
  totalStudents: number;
  totalAdmins: number;
  totalResumes: number;
  totalAssessmentsCompleted: number;
  totalJobPostings: number;
  averageResumeScore: number;
  averageAssessmentScore: number;
  averageFinalScore: number;
};

export async function getDashboardStats(): Promise<AdminDashboardStats> {
  return apiFetch<AdminDashboardStats>("/admin/dashboard", { method: "GET" });
}

// ===== 2. Users =====

export type AdminRole = "STUDENT" | "EMPLOYER" | "ADMIN";

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  telephone: string | null;
  role: AdminRole;
  createdAt: string;
  resumeCount: number;
};

export type AdminUserUpdateInput = Partial<{
  fullName: string;
  telephone: string;
  role: AdminRole;
}>;

export async function listUsers(): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>("/admin/users", { method: "GET" });
}

export async function getUser(id: string): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/admin/users/${id}`, { method: "GET" });
}

export async function updateUser(id: string, input: AdminUserUpdateInput): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

// Throws ApiError(400) with messages like:
// - "ไม่สามารถลบบัญชีของตนเองได้"
// - "ไม่สามารถลบผู้ใช้นี้ได้ เนื่องจากมีเรซูเม่ผูกอยู่ N รายการ กรุณาลบข้อมูลที่เกี่ยวข้องก่อน"
// Callers should disable delete client-side when resumeCount > 0 rather
// than relying on this error alone (see README §2.4).
export async function deleteUser(id: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/admin/users/${id}`, { method: "DELETE" });
}

// ===== 3. Resumes =====

export type AdminResume = {
  resumeId: string;
  originalFilename: string;
  uploadedAt: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  hardSkills: string[];
  softSkills: string[];
  desiredRoleName: string;
  resumeScore: number;
  assessmentScore: number | null;
  finalScore: number | null;
  assessmentCompleted: boolean;
  missingSkills: string[];
  recommendation: string | null;
};

export async function listResumes(): Promise<AdminResume[]> {
  return apiFetch<AdminResume[]>("/admin/resumes", { method: "GET" });
}

export async function getResume(id: string): Promise<AdminResume> {
  return apiFetch<AdminResume>(`/admin/resumes/${id}`, { method: "GET" });
}

// Cascade delete — removes assessment Q&A, extracted skills, all 3 score
// sets, gap analysis, and desired role along with the resume. Not
// recoverable; callers should confirm destructively before calling this.
export async function deleteResume(id: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/admin/resumes/${id}`, { method: "DELETE" });
}

// ===== 4. Jobs =====

export type AdminJob = {
  id: string;
  companyName: string;
  jobType: string;
  positionName: string;
  requiredSkills: string[]; // array on the way OUT
  jobDescription: string;
  duration: string;
  salary: string;
  contactLink: string;
  // B3/B4 (API_CHANGES.md §5.3–5.4) — absent on rows the backend hasn't filled.
  status?: JobStatus;
  openDate?: string | null;
  closeDate?: string | null;
  companyId?: string | null;
};

export type JobStatus = "DRAFT" | "OPEN" | "CLOSED";

// requiredSkills is a COMMA-STRING on the way IN — different shape from
// AdminJob.requiredSkills (array). Every skill name must match the O*NET
// taxonomy exactly (case-sensitive); pick from GET /skills/search rather
// than free text (see README §4.3).
export type AdminJobInput = {
  employerId: string;
  companyName: string;
  jobType: string;
  positionName: string;
  requiredSkills: string; // comma-separated
  jobDescription: string;
  duration: string;
  salary: string;
  contactLink: string;
  /** "YYYY-MM-DD" — openDate in the future makes the job DRAFT until then (B3). */
  openDate?: string;
  closeDate?: string;
};

export type AdminJobUpdateInput = Partial<AdminJobInput>;

export async function listJobs(): Promise<AdminJob[]> {
  return apiFetch<AdminJob[]>("/admin/jobs", { method: "GET" });
}

export async function getJob(id: string): Promise<AdminJob> {
  return apiFetch<AdminJob>(`/admin/jobs/${id}`, { method: "GET" });
}

export async function createJob(input: AdminJobInput): Promise<AdminJob> {
  return apiFetch<AdminJob>("/admin/jobs", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateJob(id: string, input: AdminJobUpdateInput): Promise<AdminJob> {
  return apiFetch<AdminJob>(`/admin/jobs/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteJob(id: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/admin/jobs/${id}`, { method: "DELETE" });
}

// ===== 5. Employer approval (B5 — API_CHANGES.md §5.5) =====
// Unlike the older admin endpoints above, the B-round endpoints wrap their
// payload in { status, message, data }. unwrap() accepts both shapes so a
// future backend tweak either way doesn't break the page.

export type EmployerAccountStatus = "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
export type EmployerStatusFilter = "PENDING" | "ACTIVE" | "REJECTED" | "ALL";

export type AdminEmployer = {
  userId: string;
  email: string;
  fullName: string;
  telephone: string | null;
  accountStatus: EmployerAccountStatus;
  createdAt: string;
  companyId: string | null;
  companyName: string | null;
  companyTaxId: string | null;
  companyStatus: string | null;
};

function unwrap<T>(res: unknown): T {
  if (res && typeof res === "object" && "data" in res && "status" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export async function listEmployers(status: EmployerStatusFilter = "PENDING"): Promise<AdminEmployer[]> {
  const res = await apiFetch<unknown>(`/admin/employers?status=${status}`, { method: "GET" });
  const data = unwrap<AdminEmployer[] | null>(res);
  return Array.isArray(data) ? data : [];
}

export async function approveEmployer(userId: string): Promise<void> {
  await apiFetch<unknown>(`/admin/employers/${userId}/approve`, { method: "POST" });
}

export async function rejectEmployer(userId: string, reason: string): Promise<void> {
  await apiFetch<unknown>(`/admin/employers/${userId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
