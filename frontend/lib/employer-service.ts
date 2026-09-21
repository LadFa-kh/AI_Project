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

import { apiFetch } from "./api-client";
import type { AdminJob, AdminJobInput, AdminJobUpdateInput } from "./admin-service";

export type EmployerJob = AdminJob;
/** employerId ไม่ต้องส่ง — backend เติมจากโทเคนให้เอง และทับค่าที่ส่งมาเสมอ */
export type EmployerJobInput = Omit<AdminJobInput, "employerId"> & { employerId?: string };
export type EmployerJobUpdateInput = AdminJobUpdateInput;

export async function listMyJobs(): Promise<EmployerJob[]> {
  return apiFetch<EmployerJob[]>("/employer/jobs", { method: "GET" });
}

export async function createMyJob(input: EmployerJobInput): Promise<EmployerJob> {
  return apiFetch<EmployerJob>("/employer/jobs", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateMyJob(id: string, input: EmployerJobUpdateInput): Promise<EmployerJob> {
  return apiFetch<EmployerJob>(`/employer/jobs/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteMyJob(id: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/employer/jobs/${id}`, { method: "DELETE" });
}
