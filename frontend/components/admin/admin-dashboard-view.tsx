"use client";

import { useCallback, useEffect, useState } from "react";
import { MOCK_ADMIN_STATS, type AdminStats } from "@/lib/admin-types";
import { ScrollReveal } from "@/components/home/scroll-reveal";
import nocturne from "@/components/ui/nocturne.module.css";
import styles from "./admin-dashboard.module.css";

type Status = "loading" | "error" | "success";

export function AdminDashboardView() {
  const [status, setStatus] = useState<Status>("loading");
  const [stats, setStats] = useState<AdminStats | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      // TODO: wire to backend — GET /admin/stats (see PROJECT_CONTEXT.md)
      const result = await new Promise<AdminStats>((resolve) =>
        setTimeout(() => resolve(MOCK_ADMIN_STATS), 600)
      );
      setStats(result);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className={nocturne.wideShell}>
      <div className={nocturne.wideContainer}>
        <ScrollReveal>
          <div className={styles.headerRow}>
            <h1 className={styles.pageHeading}>Admin dashboard</h1>
            <p className={styles.pageSubheading}>
              Overview of resume uploads, assessments, and internship matches
            </p>
          </div>
        </ScrollReveal>

        {status === "error" && (
          <>
            <p className={nocturne.formError} role="alert">
              <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V72a8,8,0,0,1,16,0v64a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z" />
              </svg>
              We couldn&apos;t load admin stats. Please try again.
            </p>
            <button type="button" onClick={load} className={nocturne.submitBtn} style={{ maxWidth: 200 }}>
              Retry
            </button>
          </>
        )}

        {status === "loading" && (
          <div className={styles.statGrid}>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className={`${nocturne.card} ${styles.statCard}`} aria-hidden="true">
                <div className={nocturne.spinner} />
              </div>
            ))}
          </div>
        )}

        {status === "success" && stats && (
          <ScrollReveal delayMs={80}>
            <div className={styles.statGrid}>
              <div className={`${nocturne.card} ${styles.statCard}`}>
                <span className={styles.statLabel}>Resumes uploaded</span>
                <span className={styles.statValue}>{stats.totalResumesUploaded}</span>
              </div>
              <div className={`${nocturne.card} ${styles.statCard}`}>
                <span className={styles.statLabel}>Assessments completed</span>
                <span className={styles.statValue}>{stats.totalAssessmentsCompleted}</span>
              </div>
              <div className={`${nocturne.card} ${styles.statCard}`}>
                <span className={styles.statLabel}>Matches generated</span>
                <span className={`${styles.statValue} ${styles.statValueAccent}`}>
                  {stats.totalMatchesGenerated}
                </span>
              </div>
              <div className={`${nocturne.card} ${styles.statCard}`}>
                <span className={styles.statLabel}>Average match score</span>
                <span className={styles.statValue}>{stats.averageMatchScore}%</span>
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}
