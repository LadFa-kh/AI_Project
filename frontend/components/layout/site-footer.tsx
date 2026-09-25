"use client";

// Footer on every page with a navbar — so after login users can always find
// the terms, privacy policy (PDPA) and their account settings.

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import styles from "./site-footer.module.css";

export function SiteFooter() {
  const { isAuthenticated } = useAuth();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span>© 2569 ResuMate · มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน วิทยาเขตขอนแก่น</span>
        <ul className={styles.links}>
          <li><Link href="/terms" className={styles.link}>ข้อกำหนดการใช้งาน</Link></li>
          <li><Link href="/privacy-policy" className={styles.link}>นโยบายความเป็นส่วนตัว</Link></li>
          {isAuthenticated && (
            <li><Link href="/settings" className={styles.link}>ตั้งค่าบัญชี / ข้อมูลของฉัน</Link></li>
          )}
        </ul>
      </div>
    </footer>
  );
}
