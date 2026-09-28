"use client";

// Every assessment round of the logged-in user (GET /assessments/me —
// API_CHANGES.md §5.14), newest first. "ดูผล" opens /evaluation-result?resumeId=…
// which loads that round via GET /assessments/me/{resumeId}.

import Link from "next/link";
import { useEffect, useState } from "react";
import { describeError } from "@/lib/api-client";
import { listMyAssessments, type AssessmentHistoryItem } from "@/lib/assessment-service";
import { formatThaiDate } from "@/lib/date-format";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import styles from "@/components/admin/admin-dashboard.module.css";

export function AssessmentHistoryPage() {
  const [items, setItems] = useState<AssessmentHistoryItem[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listMyAssessments()
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(describeError(err, "โหลดประวัติการประเมินไม่สำเร็จ"));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardShell
      eyebrow="RESUMATE — ผลการประเมิน"
      heading="ประวัติการประเมิน"
      subheading="ผลการประเมินทุกรอบของคุณ เรียงจากล่าสุด กดดูผลเพื่อเปิดรายละเอียดของรอบนั้น"
    >
      <div className={`${styles.card} ${styles.animateIn} ${styles.delay2}`}>
        <div className={styles.sectionHeadRow}>
          <div>
            <h2 className={styles.sectionHeading}>ทุกรอบ</h2>
            <p className={styles.sectionSub}>{items ? `${items.length} รอบ` : "กำลังโหลด..."}</p>
          </div>
          <Link href="/upload-resume" className={styles.refreshBtn}>
            + ประเมินรอบใหม่
          </Link>
        </div>

        {error ? (
          <p className={styles.formError} role="alert">{error}</p>
        ) : items === null ? (
          <div className={styles.skeletonCard}>
            <div className={styles.skeletonLine} style={{ height: 40 }} />
            <div className={styles.skeletonLine} style={{ height: 40 }} />
          </div>
        ) : items.length === 0 ? (
          <p className={styles.emptyState}>
            ยังไม่มีผลการประเมิน — <Link href="/upload-resume" style={{ textDecoration: "underline" }}>อัปโหลดเรซูเม่</Link> แล้วทำแบบประเมินเพื่อเริ่มต้น
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>วันที่</th><th>ไฟล์เรซูเม่</th><th>ตำแหน่งที่ใช้เทียบ</th><th>คะแนนรวม</th><th></th></tr>
              </thead>
              <tbody>
                {items.map((a, i) => (
                  <tr key={a.resumeId}>
                    <td className={styles.nowrap}>
                      {formatThaiDate(a.submittedAt)}
                      {i === 0 && <span className={`${styles.badge} ${styles.badgeEmployer}`} style={{ marginLeft: 8 }}>ล่าสุด</span>}
                    </td>
                    <td>{a.originalFilename ?? "—"}</td>
                    <td>
                      {a.roleUsedForMatching ?? "—"}
                      {a.partial && <div className={styles.userEmail}>รอบเก่า (ไม่มีรายละเอียดคะแนน)</div>}
                    </td>
                    <td><strong>{Math.round(a.finalScore)}</strong></td>
                    <td className={styles.nowrap}>
                      <Link href={`/evaluation-result?resumeId=${encodeURIComponent(a.resumeId)}`} className={styles.btnGhost}>
                        ดูผล
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
