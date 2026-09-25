// UI-local types for /admin. Real data now comes from admin-service.ts
// (GET /admin/dashboard, /admin/users, /admin/resumes, /admin/jobs — see
// README_Admin_API.md). This file only keeps small view-layer types that
// don't belong in the service layer.

// Tabs shown on the admin page. "activity feed" / "7-day upload chart" from
// the original demo were dropped — backend has no endpoint for either (see
// README_Admin_API.md "สิ่งที่ยังไม่มี Endpoint").
export type AdminTab = "dashboard" | "users" | "employers" | "companies" | "resumes" | "jobs" | "internships" | "usage";

export const ADMIN_TABS: { key: AdminTab; label: string }[] = [
  { key: "dashboard", label: "ภาพรวม" },
  { key: "users", label: "ผู้ใช้งาน" },
  { key: "employers", label: "อนุมัติผู้ประกาศงาน" },
  { key: "companies", label: "บริษัท / นำเข้า" },
  { key: "resumes", label: "เรซูเม่" },
  { key: "jobs", label: "ประกาศงาน" },
  { key: "internships", label: "ฝึกงาน" },
  { key: "usage", label: "การใช้งาน" },
];
