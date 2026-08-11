import type { ReactNode } from "react";
import styles from "./match-detail.module.css";

type MatchDetailFactProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

export function MatchDetailFact({ icon, label, value }: MatchDetailFactProps) {
  return (
    <div className={styles.detailItem}>
      <span className={styles.detailIcon} aria-hidden="true">
        {icon}
      </span>
      <div className={styles.detailTextBlock}>
        <span className={styles.detailLabel}>{label}</span>
        <span className={styles.detailValue}>{value}</span>
      </div>
    </div>
  );
}
