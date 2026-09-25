import type { Metadata } from "next";
import Link from "next/link";
import { TERMS_EFFECTIVE_DATE_LABEL, TERMS_VERSION, TermsContent } from "@/components/legal/terms-content";
import styles from "@/components/legal/privacy-policy.module.css";

export const metadata: Metadata = {
  title: "ข้อกำหนดการใช้งาน — ResuMate",
  description: "ข้อกำหนดการใช้งานระบบ ResuMate สำหรับนักศึกษาและผู้ประกาศงาน",
};

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>ResuMate</span>
        <h1 className={styles.title}>ข้อกำหนดการใช้งาน</h1>
        <div className={styles.meta}>
          <span className={styles.metaChip}>เวอร์ชัน {TERMS_VERSION}</span>
          <span className={styles.metaChip}>มีผลตั้งแต่ {TERMS_EFFECTIVE_DATE_LABEL}</span>
        </div>
      </header>

      <TermsContent />

      <footer className={styles.footer}>
        <span>ข้อกำหนดการใช้งาน เวอร์ชัน {TERMS_VERSION}</span>
        <Link href="/" className={styles.link}>กลับสู่หน้าหลัก</Link>
      </footer>
    </main>
  );
}
