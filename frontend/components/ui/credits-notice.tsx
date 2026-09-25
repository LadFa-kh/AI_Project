"use client";

// "เหลือ 24/30 ครั้ง" counter (API_CHANGES.md §5.8). Renders nothing until
// credits load (or if the endpoint fails) and for unlimited (ADMIN) accounts.

import type { Credits } from "@/lib/credit-service";
import styles from "./credits-notice.module.css";

function formatReset(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export function CreditsNotice({ credits, className }: { credits: Credits | null; className?: string }) {
  if (!credits || credits.unlimited || credits.remaining === null || credits.monthlyLimit === null) return null;
  const empty = credits.remaining <= 0;
  const reset = formatReset(credits.resetAt);

  return (
    <p className={`${styles.notice} ${className ?? ""}`} role="status">
      <span className={`${styles.dot} ${empty ? styles.dotEmpty : ""}`} aria-hidden="true" />
      {empty ? (
        <span className={styles.empty}>เครดิตเดือนนี้หมดแล้ว</span>
      ) : (
        <span>
          เครดิตคงเหลือ <span className={styles.count}>{credits.remaining}/{credits.monthlyLimit}</span> ครั้งในเดือนนี้
        </span>
      )}
      {reset && <span>· รีเซ็ต {reset}</span>}
    </p>
  );
}
