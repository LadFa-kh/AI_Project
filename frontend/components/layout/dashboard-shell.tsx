"use client";

// Page chrome shared by the newer dashboard-style pages (/internships,
// /settings) — same look as /admin and /employer/jobs (blobs, eyebrow,
// heading, admin-dashboard.module.css) minus the particle canvas, so each
// new page doesn't copy ~80 lines of canvas code.

import type { ReactNode } from "react";
import styles from "@/components/admin/admin-dashboard.module.css";

export function DashboardShell({
  eyebrow,
  heading,
  subheading,
  children,
}: {
  eyebrow: string;
  heading: string;
  subheading?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.page}>
      <div className={styles.ambient} aria-hidden="true">
        <div className={`${styles.blob} ${styles.blobOne}`} />
        <div className={`${styles.blob} ${styles.blobTwo}`} />
      </div>
      <main className={styles.main}>
        <div className={`${styles.headerRow} ${styles.animateIn} ${styles.delay1}`}>
          <div>
            <span className={styles.eyebrow}>{eyebrow}</span>
            <h1 className={styles.pageHeading}>{heading}</h1>
            {subheading && <p className={styles.pageSubheading}>{subheading}</p>}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
