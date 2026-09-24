// Shown instead of the form when an employer account is waiting for admin
// approval — after register (201 + code EMPLOYER_PENDING, no cookie) or
// when such an account tries to log in (403 EMPLOYER_PENDING).
// See API_CHANGES.md §5.5.

import styles from "./employer-pending-notice.module.css";

type Props = {
  /** Backend message, shown as-is under the heading when present. */
  message?: string | null;
  onBack?: () => void;
  backLabel?: string;
};

export function EmployerPendingNotice({ message, onBack, backLabel = "กลับไปหน้าเข้าสู่ระบบ" }: Props) {
  return (
    <div className={styles.notice} role="status" aria-live="polite">
      <span className={styles.icon} aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 256 256" fill="currentColor">
          <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z" />
        </svg>
      </span>
      <h2 className={styles.title}>บัญชีผู้ประกาศงานกำลังรอการอนุมัติ</h2>
      <p className={styles.text}>
        {message || "ผู้ดูแลระบบจะตรวจสอบข้อมูลบริษัทของคุณ เมื่ออนุมัติแล้วจะเข้าสู่ระบบและลงประกาศงานได้"}
      </p>
      <ul className={styles.steps}>
        <li>ผู้ดูแลระบบตรวจสอบข้อมูลบริษัท</li>
        <li>เมื่ออนุมัติแล้ว เข้าสู่ระบบด้วยอีเมลและรหัสผ่านที่สมัครไว้</li>
        <li>ลงประกาศงานได้ทันทีหลังเข้าสู่ระบบ</li>
      </ul>
      {onBack && (
        <button type="button" className={styles.backBtn} onClick={onBack}>
          {backLabel}
        </button>
      )}
    </div>
  );
}
