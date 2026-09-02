// ดึงรายละเอียดตำแหน่งงานทีละรายการ
// GET /jobs/{id} -> JobDescriptionResponseDto (backend/company/controller/JobController)
//
// endpoint นี้เพิ่งถูกเพิ่มเข้ามาเพื่อแก้ปัญหาที่หน้ารายละเอียดฝึกงานไม่แสดง
// ข้อมูลที่ผู้ประกาศกรอกไว้ เดิมหน้านั้นอ่านจาก sessionStorage ของรายการที่โหลด
// ไว้ก่อนหน้า ซึ่งมีแค่ชื่อบริษัท ตำแหน่ง ประเภทงาน และทักษะ ฟิลด์อย่าง
// คำอธิบายงาน ระยะเวลา ค่าตอบแทน และลิงก์สมัคร จึงไม่เคยถูกส่งมาถึงหน้าเว็บเลย
// ทั้งที่บันทึกอยู่ในฐานข้อมูลครบถ้วน
//
// หมายเหตุชื่อฟิลด์: endpoint นี้คืน `id` (ไม่ใช่ `jobId` แบบ
// /matching/recommendations) ผู้เรียกจึง map ให้ตรงกับ DisplayJob ก่อนใช้งาน

import { apiFetch } from "./api-client";

export type JobDetail = {
  id: string;
  companyName: string;
  jobType: string | null;
  positionName: string;
  requiredSkills: string[];
  jobDescription: string | null;
  duration: string | null;
  salary: string | null;
  contactLink: string | null;
};

export async function getJobById(jobId: string): Promise<JobDetail> {
  return apiFetch<JobDetail>(`/jobs/${jobId}`, { method: "GET" });
}
