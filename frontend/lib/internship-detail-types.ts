// Internship DETAIL page types.
//
// เดิมหน้านี้ไม่มี endpoint สำหรับดึงงานทีละรายการ จึงต้องหยิบข้อมูลจากรายการที่
// โหลดค้างไว้ใน sessionStorage (lib/match-session.ts หรือ lib/workplace-session.ts)
// ซึ่งมีแค่ข้อมูลย่อสำหรับแสดงการ์ด ตอนนี้มี GET /jobs/{id} แล้ว
// (lib/job-detail-service.ts) หน้านี้จึงเรียก endpoint นั้นเป็นหลัก แล้วใช้ค่าจาก
// sessionStorage เป็นตัวเสริมสำหรับคะแนนความเหมาะสมกับผู้ใช้ ซึ่งเป็นข้อมูล
// เฉพาะบุคคลที่ /jobs/{id} ไม่ได้คืนมา

import type { DisplayJob } from "./internship-match-types";

export type InternshipDetail = DisplayJob & {
  jobDescription?: string | null;
  duration?: string | null;
  salary?: string | null;
  contactLink?: string | null;
};
