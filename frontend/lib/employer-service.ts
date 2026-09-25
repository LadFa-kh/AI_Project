// เส้นทางจัดการประกาศงานสำหรับบัญชี EMPLOYER
//
// เดิมหน้า /employer/jobs เรียกฟังก์ชันจาก admin-service ซึ่งยิงไปที่
// /admin/jobs โดย SecurityConfig ฝั่ง backend เปิดให้เฉพาะบทบาท ADMIN
// บัญชี EMPLOYER จึงได้รหัสสถานะ 403 ทันทีที่เปิดหน้า และต่อให้ผ่านสิทธิ์ได้
// เส้นทางนั้นก็คืนประกาศงานของทุกบริษัทโดยไม่กรองเจ้าของ
//
// ชุดนี้เรียก /employer/jobs แทน ซึ่ง backend ดึงรหัสผู้ประกาศจากโทเคนเอง
// จึงคืนเฉพาะประกาศของผู้ที่ล็อกอินอยู่ และปฏิเสธการแก้ไขประกาศของผู้อื่น
// ด้วยรหัสสถานะ 403
//
// รูปร่างข้อมูลเหมือน admin-service ทุกประการ จึงใช้ชนิดข้อมูลร่วมกันได้

import { apiFetch, unwrap, unwrapList } from "./api-client";
import type { AdminJob, AdminJobInput, AdminJobUpdateInput, JobStatus } from "./admin-service";

export type { JobStatus };

export type EmployerJob = AdminJob;
/** employerId ไม่ต้องส่ง — backend เติมจากโทเคนให้เอง และทับค่าที่ส่งมาเสมอ */
export type EmployerJobInput = Omit<AdminJobInput, "employerId"> & { employerId?: string };
export type EmployerJobUpdateInput = AdminJobUpdateInput;

// Envelope/bare handled defensively — TESTING_FLOWS.md itself reads
// `job.data?.id ?? job.id`, so the shape isn't pinned down yet.
export async function listMyJobs(): Promise<EmployerJob[]> {
  const res = await apiFetch<unknown>("/employer/jobs", { method: "GET" });
  return unwrapList<EmployerJob>(res);
}

export async function createMyJob(input: EmployerJobInput): Promise<EmployerJob> {
  const res = await apiFetch<unknown>("/employer/jobs", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return unwrap<EmployerJob>(res);
}

export async function updateMyJob(id: string, input: EmployerJobUpdateInput): Promise<EmployerJob> {
  const res = await apiFetch<unknown>(`/employer/jobs/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return unwrap<EmployerJob>(res);
}

export type JobStatusInput = {
  status: Exclude<JobStatus, "DRAFT">;
  openDate?: string;
  closeDate?: string;
};

// PATCH /jobs/{id}/status — owner or ADMIN; other owners get 403 NOT_JOB_OWNER (B3).
export async function setJobStatus(id: string, input: JobStatusInput): Promise<void> {
  await apiFetch<unknown>(`/jobs/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteMyJob(id: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/employer/jobs/${id}`, { method: "DELETE" });
}
