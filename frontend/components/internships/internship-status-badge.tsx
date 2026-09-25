import { INTERNSHIP_STATUS_LABEL, type InternshipStatus } from "@/lib/internship-service";
import styles from "@/components/admin/admin-dashboard.module.css";

const BADGE: Record<InternshipStatus, string> = {
  APPLIED: styles.badgePending,
  ACCEPTED: styles.badgeStudent,
  IN_PROGRESS: styles.badgeEmployer,
  COMPLETED: styles.badgeEmployer,
  CANCELLED: styles.badgeNeutral,
  REJECTED: styles.badgeRejected,
};

export function InternshipStatusBadge({ status }: { status: InternshipStatus }) {
  return (
    <span className={`${styles.badge} ${BADGE[status] ?? styles.badgeNeutral}`}>
      {INTERNSHIP_STATUS_LABEL[status] ?? status}
    </span>
  );
}
