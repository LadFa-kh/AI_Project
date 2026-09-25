"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MyInternshipsView } from "./my-internships-view";
import styles from "@/components/admin/admin-dashboard.module.css";

export function StudentInternshipsPage() {
  const { user } = useAuth();
  const isStudent = user?.role === "STUDENT";

  return (
    <DashboardShell
      eyebrow="RESUMATE — ฝึกงาน"
      heading="ประวัติฝึกงาน"
      subheading="บันทึกที่ที่คุณสมัคร กำลังฝึก หรือฝึกงานเสร็จแล้ว บริษัทในระบบจะอัปเดตสถานะให้"
    >
      {isStudent ? (
        <MyInternshipsView />
      ) : (
        <div className={`${styles.card} ${styles.animateIn} ${styles.delay2}`}>
          <p className={styles.emptyState}>
            หน้านี้สำหรับบัญชีนักศึกษา
            {user?.role === "EMPLOYER" && (
              <>
                {" "}— ผู้ประกาศงานดูผู้ฝึกงานได้ที่ <Link href="/employer/jobs">หน้าประกาศงาน</Link>
              </>
            )}
          </p>
        </div>
      )}
    </DashboardShell>
  );
}
