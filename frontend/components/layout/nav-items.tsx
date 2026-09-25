import type { ReactNode } from "react";

export type NavItemDef = {
  href: string;
  label: string;
  icon: ReactNode;
  /** Only shown to users whose role is "ADMIN" (see AdminGuard). */
  adminOnly?: boolean;
  /**
   * Only shown to users whose role is "EMPLOYER". Points at the dedicated
   * /employer/jobs page (see components/employer/*) — a standalone
   * job-posting list, separate from /admin's Jobs tab. Note: the admin API
   * (README_Admin_API.md) has no employer-scoped "my jobs" endpoint yet —
   * GET /admin/jobs returns every company's postings, and every job
   * endpoint still requires an ADMIN-role session on the backend, so this
   * page currently only works if the backend grants EMPLOYER access too.
   */
  employerOnly?: boolean;
  /** Only shown to STUDENT accounts (e.g. /internships — B6). */
  studentOnly?: boolean;
};

function Icon({ path }: { path: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export const NAV_ITEMS: NavItemDef[] = [
  {
    href: "/",
    label: "หน้าหลัก",
    icon: (
      <Icon path="M218.83,103.77l-80-75.48a20,20,0,0,0-27.66,0l-80,75.48A20,20,0,0,0,25,119.87V208a20,20,0,0,0,20,20H96a12,12,0,0,0,12-12V160h40v56a12,12,0,0,0,12,12h51a20,20,0,0,0,20-20V119.87A20,20,0,0,0,218.83,103.77Z" />
    ),
  },
  {
    href: "/upload-resume",
    label: "อัปโหลดเรซูเม่",
    icon: (
      <Icon path="M224,152v56a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V152a8,8,0,0,1,16,0v56H208V152a8,8,0,0,1,16,0ZM93.66,77.66,120,51.31V152a8,8,0,0,0,16,0V51.31l26.34,26.35a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,93.66,77.66Z" />
    ),
  },
  {
    href: "/skill-assessment",
    label: "แบบประเมินทักษะ",
    icon: (
      <Icon path="M223.68,66.15,135.68,18a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15ZM128,32l80,43.79-30.24,16.55-80.06-43.8Zm0,88L47.99,76.21l33.02-18.06,80.06,43.79ZM40,90.42l80,43.79v85.55L40,175.95Zm96,129.34V134.21l32-17.51V152a8,8,0,0,0,16,0V107.79L216,90.42v85.53Z" />
    ),
  },
  {
    href: "/evaluation-result",
    label: "ผลการประเมิน",
    icon: (
      <Icon path="M222,58.06,169.94,6a8,8,0,0,0-11.32,0L48.68,115.92a16.11,16.11,0,0,0-4.68,11.32V208a16,16,0,0,0,16,16h80.76a16.11,16.11,0,0,0,11.32-4.68L222,109.38a8,8,0,0,0,0-11.32ZM140.76,208H60V127.24l68-68L196.76,127.24l-56,56Z" />
    ),
  },
  {
    href: "/internship-matches",
    label: "ตำแหน่งฝึกงานที่แนะนำ",
    icon: (
      <Icon path="M216,56H176V48a24,24,0,0,0-24-24H104A24,24,0,0,0,80,48v8H40A16,16,0,0,0,24,72V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V72A16,16,0,0,0,216,56ZM96,48a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96ZM216,72V115.4a151.66,151.66,0,0,1-72,20.71V128a8,8,0,0,0-8-8H120a8,8,0,0,0-8,8v8.11A151.66,151.66,0,0,1,40,115.4V72ZM136,144v16h-16V144ZM40,192V133.53a167.55,167.55,0,0,0,64,17.2V152a16,16,0,0,0,16,16h16a16,16,0,0,0,16-16v-1.27a167.55,167.55,0,0,0,64-17.2V192Z" />
    ),
  },
  {
    href: "/internships",
    label: "ประวัติฝึกงาน",
    studentOnly: true,
    icon: (
      <Icon path="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z" />
    ),
  },
  {
    href: "/admin",
    label: "ผู้ดูแลระบบ",
    adminOnly: true,
    icon: (
      <Icon path="M222.14,58.87A8,8,0,0,0,215,54H180.7a75.6,75.6,0,0,0-52.7,21.34A75.6,75.6,0,0,0,75.3,54H41a8,8,0,0,0-7.12,4.87,79.61,79.61,0,0,0,7.85,82.55A8,8,0,0,0,48,144H80a71.6,71.6,0,0,0,25.36-4.61A71.86,71.86,0,0,0,120,168.51V216a8,8,0,0,0,16,0V168.51a71.86,71.86,0,0,0,14.64-29.12A71.6,71.6,0,0,0,176,144h32a8,8,0,0,0,6.27-3.06A79.6,79.6,0,0,0,222.14,58.87ZM48.7,128a63.68,63.68,0,0,1-3.66-58,63.71,63.71,0,0,1,58,58ZM128,150a55.72,55.72,0,0,1-4.7-22.94,56.11,56.11,0,0,1,9.4-31,55.72,55.72,0,0,1,4.7,22.94A56.11,56.11,0,0,1,128,150Zm79.3-22H162.29a63.71,63.71,0,0,1,58-58,63.68,63.68,0,0,1-3.66,58Z" />
    ),
  },
  {
    href: "/employer/jobs",
    label: "สร้างประกาศงาน",
    employerOnly: true,
    icon: (
      <Icon path="M216,56H176V48a24,24,0,0,0-24-24H104A24,24,0,0,0,80,48v8H40A16,16,0,0,0,24,72V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V72A16,16,0,0,0,216,56ZM96,48a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm32,88a12,12,0,1,1,12-12A12,12,0,0,1,128,136Zm88,56H40V72H216Z" />
    ),
  },
];
