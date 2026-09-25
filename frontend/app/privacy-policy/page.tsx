import type { Metadata } from "next";
import Link from "next/link";
import {
  PRIVACY_POLICY_EFFECTIVE_DATE_LABEL,
  PRIVACY_POLICY_VERSION,
  PrivacyPolicyContent,
} from "@/components/legal/privacy-policy-content";
import styles from "@/components/legal/privacy-policy.module.css";

// Version must match GET /api/v1/policies/current → { version, url: "/privacy-policy" }.
// Text lives in components/legal/privacy-policy-content.tsx.

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว — ResuMate",
  description: "วิธีที่ ResuMate เก็บ ใช้ และคุ้มครองข้อมูลส่วนบุคคลของคุณตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล (PDPA)",
};

export default function PrivacyPolicyPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>ResuMate — PDPA</span>
        <h1 className={styles.title}>นโยบายความเป็นส่วนตัว</h1>
        <div className={styles.meta}>
          <span className={styles.metaChip}>เวอร์ชัน {PRIVACY_POLICY_VERSION}</span>
          <span className={styles.metaChip}>มีผลตั้งแต่ {PRIVACY_POLICY_EFFECTIVE_DATE_LABEL}</span>
        </div>
      </header>

      <PrivacyPolicyContent />

      <footer className={styles.footer}>
        <span>นโยบายความเป็นส่วนตัว เวอร์ชัน {PRIVACY_POLICY_VERSION}</span>
        <Link href="/" className={styles.link}>กลับสู่หน้าหลัก</Link>
      </footer>
    </main>
  );
}
