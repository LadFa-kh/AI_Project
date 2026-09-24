"use client";

// Dashboard content — real Admin API data (lib/admin-service.ts), tabbed
// into Dashboard / Users / Resumes / Jobs. Page-level chrome (particle
// canvas, blobs, heading) lives in admin-dashboard-flow.tsx.
//
// Endpoints: README_Admin_API.md (13 endpoints, no pagination/sorting —
// every list call returns everything in one shot; we sort client-side).
// "Activity feed" / "7-day upload chart" from the original demo were
// dropped — no backend endpoint backs either.

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  getDashboardStats,
  listUsers,
  updateUser,
  deleteUser,
  listResumes,
  deleteResume,
  listJobs,
  createJob,
  updateJob,
  deleteJob,
  listEmployers,
  approveEmployer,
  rejectEmployer,
  type AdminEmployer,
  type EmployerAccountStatus,
  type EmployerStatusFilter,
  type AdminDashboardStats,
  type AdminUser,
  type AdminRole,
  type AdminResume,
  type AdminJob,
  type AdminJobInput,
} from "@/lib/admin-service";
import { ApiError, describeError } from "@/lib/api-client";
import { ADMIN_TABS, type AdminTab } from "@/lib/admin-types";
import styles from "./admin-dashboard.module.css";

type Status = "loading" | "error" | "success";

// ===== Animated count-up — mounts at 0, eases up to the target value once
// the stat card has finished its entrance animation. Respects
// prefers-reduced-motion by jumping straight to the final value. =====
function useCountUp(target: number, startDelayMs = 240, durationMs = 1100) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplay(target);
      return;
    }

    let raf = 0;
    let cancelled = false;
    const startTimer = setTimeout(() => {
      const start = performance.now();
      function tick(now: number) {
        if (cancelled) return;
        const t = Math.min(1, Math.max(0, (now - start) / durationMs));
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(Math.round(eased * target * 100) / 100);
        if (t < 1) raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);
    }, startDelayMs);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, startDelayMs, durationMs]);

  return display;
}

function StatCard({
  icon,
  iconColorA,
  iconColorB,
  glow,
  label,
  value,
  suffix,
  gradientValue,
  sub,
}: {
  icon: React.ReactNode;
  iconColorA: string;
  iconColorB: string;
  glow: string;
  label: string;
  value: number;
  suffix?: string;
  gradientValue?: boolean;
  sub?: string;
}) {
  const display = useCountUp(value);
  return (
    <div className={`${styles.card} ${styles.statCard}`} style={{ ["--glow" as string]: glow }}>
      <div className={styles.statTopRow}>
        <span
          className={styles.statIcon}
          style={{ ["--icon-a" as string]: iconColorA, ["--icon-b" as string]: iconColorB }}
        >
          {icon}
        </span>
      </div>
      <span className={`${styles.statValue} ${gradientValue ? styles.statValueGradient : ""}`}>
        {display}
        {suffix ?? ""}
      </span>
      <span className={styles.statLabel}>{label}</span>
      {sub && <span className={styles.statSub}>{sub}</span>}
    </div>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={styles.animateIn}>
      <p className={styles.formError} role="alert">
        <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
          <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V72a8,8,0,0,1,16,0v64a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z" />
        </svg>
        {message}
      </p>
      <button type="button" onClick={onRetry} className={styles.refreshBtn} style={{ marginTop: 12 }}>
        ลองใหม่
      </button>
    </div>
  );
}

function extractMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}

// ===== Dashboard tab =====
function DashboardTab() {
  const [status, setStatus] = useState<Status>("loading");
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const result = await getDashboardStats();
      setStats(result);
      setStatus("success");
    } catch (err) {
      setError(extractMessage(err, "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้ กรุณาลองใหม่อีกครั้ง"));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (status === "error") return <ErrorPanel message={error} onRetry={load} />;

  if (status === "loading" || !stats) {
    return (
      <div className={styles.statGrid}>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={`${styles.card} ${styles.skeletonCard}`} aria-hidden="true">
            <div className={styles.skeletonLine} style={{ width: "40%", height: 20 }} />
            <div className={styles.skeletonLine} style={{ width: "60%", height: 32 }} />
            <div className={styles.skeletonLine} style={{ width: "70%" }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`${styles.statGrid} ${styles.animateIn} ${styles.delay2}`}>
      <StatCard
        icon={
          <svg width="17" height="17" viewBox="0 0 256 256" fill="currentColor">
            <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM44,120a44,44,0,1,1,44,44A44.05,44.05,0,0,1,44,120Z" />
          </svg>
        }
        iconColorA="var(--color-home-hero-accent-1)"
        iconColorB="#a78bfa"
        glow="color-mix(in srgb, var(--color-home-hero-accent-1) 30%, transparent)"
        label="ผู้ใช้งานทั้งหมด"
        value={stats.totalUsers}
        sub={`นักศึกษา ${stats.totalStudents} · แอดมิน ${stats.totalAdmins}`}
      />
      <StatCard
        icon={
          <svg width="17" height="17" viewBox="0 0 256 256" fill="currentColor">
            <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z" />
          </svg>
        }
        iconColorA="var(--color-home-hero-accent-3)"
        iconColorB="#60a5fa"
        glow="color-mix(in srgb, var(--color-home-hero-accent-3) 30%, transparent)"
        label="เรซูเม่ทั้งหมด"
        value={stats.totalResumes}
      />
      <StatCard
        icon={
          <svg width="17" height="17" viewBox="0 0 256 256" fill="currentColor">
            <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
          </svg>
        }
        iconColorA="var(--color-home-hero-accent-2)"
        iconColorB="#f472b6"
        glow="color-mix(in srgb, var(--color-home-hero-accent-2) 30%, transparent)"
        label="แบบประเมินที่เสร็จสิ้น"
        value={stats.totalAssessmentsCompleted}
        gradientValue
      />
      <StatCard
        icon={
          <svg width="17" height="17" viewBox="0 0 256 256" fill="currentColor">
            <path d="M247.42,117l-14-35A15.93,15.93,0,0,0,218.58,72H184V64a8,8,0,0,0-8-8H24A16,16,0,0,0,8,72V184a16,16,0,0,0,16,16H41a32,32,0,0,0,62,0h50a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V120A7.94,7.94,0,0,0,247.42,117ZM184,88h34.58l9.6,24H184ZM72,208a16,16,0,1,1,16-16A16,16,0,0,1,72,208Zm81-24H103a32,32,0,0,0-62,0H24V72H168v88h-1A32,32,0,0,0,153,184Zm31,24a16,16,0,1,1,16-16A16,16,0,0,1,184,208Zm40-24h-8a32,32,0,0,0-8.42-14.4L200,128h32v56Z" />
          </svg>
        }
        iconColorA="#8b5cf6"
        iconColorB="#c4b5fd"
        glow="rgba(139,92,246,0.3)"
        label="ประกาศงานทั้งหมด"
        value={stats.totalJobPostings}
      />
      <StatCard
        icon={
          <svg width="17" height="17" viewBox="0 0 256 256" fill="currentColor">
            <path d="M128,24A104,104,0,1,0,232,128,104.12,104.12,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm40-88a40,40,0,1,1-40-40A40,40,0,0,1,168,128Z" />
          </svg>
        }
        iconColorA="var(--color-home-hero-accent-1)"
        iconColorB="#a78bfa"
        glow="color-mix(in srgb, var(--color-home-hero-accent-1) 30%, transparent)"
        label="คะแนนเรซูเม่เฉลี่ย"
        value={stats.averageResumeScore}
        suffix="%"
      />
      <StatCard
        icon={
          <svg width="17" height="17" viewBox="0 0 256 256" fill="currentColor">
            <path d="M128,24A104,104,0,1,0,232,128,104.12,104.12,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm37.66-125.66a8,8,0,0,1,0,11.32l-40,40a8,8,0,0,1-11.32,0l-16-16a8,8,0,0,1,11.32-11.32L120,128.69l34.34-34.35A8,8,0,0,1,165.66,90.34Z" />
          </svg>
        }
        iconColorA="var(--color-home-hero-accent-3)"
        iconColorB="#60a5fa"
        glow="color-mix(in srgb, var(--color-home-hero-accent-3) 30%, transparent)"
        label="คะแนนรวมเฉลี่ย (Final)"
        value={stats.averageFinalScore}
        suffix="%"
        sub={`แบบประเมินเฉลี่ย ${stats.averageAssessmentScore.toFixed(2)}%`}
      />
    </div>
  );
}

// ===== Users tab =====
function EditUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser;
  onClose: () => void;
  onSaved: (updated: AdminUser) => void;
}) {
  const [fullName, setFullName] = useState(user.fullName);
  const [telephone, setTelephone] = useState(user.telephone ?? "");
  const [role, setRole] = useState<AdminRole>(user.role);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const updated = await updateUser(user.id, { fullName, telephone, role });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(extractMessage(err, "บันทึกไม่สำเร็จ กรุณาลองใหม่"));
    } finally {
      setSaving(false);
    }
  }

  // Rendered via a portal straight onto <body> — without this, the fixed
  // overlay was containing-blocked by the ancestor .card's backdrop-filter
  // (any filter/backdrop-filter/transform on an ancestor traps
  // position:fixed inside that ancestor's box instead of the viewport),
  // which is why the modal used to appear pinned to the table's scroll
  // position instead of centered on screen.
  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>แก้ไขผู้ใช้งาน</h3>
        {error && (
          <p className={styles.formError} role="alert" style={{ marginBottom: 12 }}>
            {error}
          </p>
        )}
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="edit-fullname">ชื่อ-นามสกุล</label>
          <input
            id="edit-fullname"
            className={styles.formInput}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="edit-tel">เบอร์โทร</label>
          <input
            id="edit-tel"
            className={styles.formInput}
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="เว้นว่างเพื่อล้างเบอร์โทร"
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="edit-role">บทบาท</label>
          <select
            id="edit-role"
            className={styles.formSelect}
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
          >
            <option value="STUDENT">STUDENT</option>
            <option value="EMPLOYER">EMPLOYER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
        <p className={styles.statSub} style={{ marginTop: -4 }}>
          อีเมลและรหัสผ่านแก้ไขไม่ได้จากหน้านี้
        </p>
        <div className={styles.modalActions}>
          <button type="button" className={styles.btnGhost} onClick={onClose} disabled={saving}>
            ยกเลิก
          </button>
          <button type="button" className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function UsersTab() {
  const [status, setStatus] = useState<Status>("loading");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const result = await listUsers();
      result.sort((a, b) => a.fullName.localeCompare(b.fullName, "th"));
      setUsers(result);
      setStatus("success");
    } catch (err) {
      setError(extractMessage(err, "ไม่สามารถโหลดรายชื่อผู้ใช้ได้"));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  async function handleDelete(user: AdminUser) {
    if (user.resumeCount > 0) return; // guarded in UI per README §2.4
    if (!window.confirm(`ยืนยันลบผู้ใช้ "${user.fullName}"? การกระทำนี้กู้คืนไม่ได้`)) return;
    setDeletingId(user.id);
    setRowError(null);
    try {
      await deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      setRowError({ id: user.id, message: extractMessage(err, "ลบไม่สำเร็จ") });
    } finally {
      setDeletingId(null);
    }
  }

  const badgeClass = (role: AdminRole) =>
    role === "ADMIN" ? styles.badgeAdmin : role === "EMPLOYER" ? styles.badgeEmployer : styles.badgeStudent;

  if (status === "error") return <ErrorPanel message={error} onRetry={load} />;

  return (
    <div className={`${styles.card} ${styles.animateIn} ${styles.delay2}`}>
      <div className={styles.sectionHeadRow}>
        <div>
          <h2 className={styles.sectionHeading}>ผู้ใช้งานทั้งหมด</h2>
          <p className={styles.sectionSub}>{users.length} รายการ</p>
        </div>
        <input
          className={styles.searchInput}
          placeholder="ค้นหาชื่อหรืออีเมล..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {status === "loading" ? (
        <div className={styles.skeletonCard}>
          <div className={styles.skeletonLine} style={{ height: 40 }} />
          <div className={styles.skeletonLine} style={{ height: 40 }} />
          <div className={styles.skeletonLine} style={{ height: 40 }} />
        </div>
      ) : filtered.length === 0 ? (
        <p className={styles.emptyState}>ไม่พบผู้ใช้งานที่ตรงกับคำค้นหา</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ผู้ใช้งาน</th>
                <th>บทบาท</th>
                <th>เรซูเม่</th>
                <th>เข้าร่วมเมื่อ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <Fragment key={u.id}>
                  <tr>
                    <td>
                      <div className={styles.userCell}>
                        <span className={styles.avatar} aria-hidden="true">
                          {u.fullName.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <div className={styles.userName}>{u.fullName}</div>
                          <div className={styles.userEmail}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className={styles.nowrap}>
                      <span className={`${styles.badge} ${badgeClass(u.role)}`}>{u.role}</span>
                    </td>
                    <td className={styles.nowrap}>{u.resumeCount > 0 ? u.resumeCount : "—"}</td>
                    <td className={styles.nowrap}>{new Date(u.createdAt).toLocaleDateString("th-TH")}</td>
                    <td className={styles.nowrap}>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => setEditing(u)}
                          title="แก้ไข"
                          aria-label={`แก้ไข ${u.fullName}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
                            <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69a15.86,15.86,0,0,0,11.31-4.69L227.31,96A16,16,0,0,0,227.31,73.37ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          onClick={() => handleDelete(u)}
                          disabled={u.resumeCount > 0 || deletingId === u.id}
                          title={u.resumeCount > 0 ? "ต้องลบเรซูเม่ของผู้ใช้นี้ก่อน" : "ลบผู้ใช้"}
                          aria-label={`ลบ ${u.fullName}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
                            <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {rowError?.id === u.id && (
                    <tr>
                      <td colSpan={5} style={{ borderBottom: "none", paddingTop: 0 }}>
                        <p className={styles.formError} role="alert">{rowError.message}</p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))}
        />
      )}
    </div>
  );
}

// ===== Employers tab — approve/reject employer sign-ups (B5, API_CHANGES.md §5.5) =====
const EMPLOYER_FILTERS: { value: EmployerStatusFilter; label: string }[] = [
  { value: "PENDING", label: "รออนุมัติ" },
  { value: "ACTIVE", label: "อนุมัติแล้ว" },
  { value: "REJECTED", label: "ปฏิเสธแล้ว" },
  { value: "ALL", label: "ทั้งหมด" },
];

const EMPLOYER_STATUS_LABEL: Record<EmployerAccountStatus, string> = {
  PENDING: "รออนุมัติ",
  ACTIVE: "อนุมัติแล้ว",
  REJECTED: "ปฏิเสธแล้ว",
  SUSPENDED: "ระงับ",
};

function RejectEmployerModal({
  employer,
  onClose,
  onRejected,
}: {
  employer: AdminEmployer;
  onClose: () => void;
  onRejected: () => void;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleReject() {
    if (!reason.trim()) {
      setError("กรุณาระบุเหตุผลที่ปฏิเสธ");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await rejectEmployer(employer.userId, reason.trim());
      onRejected();
      onClose();
    } catch (err) {
      setError(describeError(err, "ปฏิเสธไม่สำเร็จ กรุณาลองใหม่"));
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>ปฏิเสธผู้ประกาศงาน</h3>
        <p className={styles.statSub} style={{ marginTop: -4, marginBottom: 12 }}>
          {employer.companyName ?? "—"} · {employer.fullName} ({employer.email})
        </p>
        {error && (
          <p className={styles.formError} role="alert" style={{ marginBottom: 12 }}>
            {error}
          </p>
        )}
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="reject-reason">เหตุผล (แจ้งให้ผู้สมัครทราบ)</label>
          <textarea
            id="reject-reason"
            className={`${styles.formInput} ${styles.formTextarea}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="เช่น ข้อมูลบริษัทไม่ครบ หรือไม่สามารถยืนยันตัวตนบริษัทได้"
            rows={3}
          />
        </div>
        <div className={styles.modalActions}>
          <button type="button" className={styles.btnGhost} onClick={onClose} disabled={saving}>
            ยกเลิก
          </button>
          <button type="button" className={styles.btnDanger} onClick={handleReject} disabled={saving}>
            {saving ? "กำลังบันทึก..." : "ยืนยันปฏิเสธ"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function EmployersTab() {
  const [filter, setFilter] = useState<EmployerStatusFilter>("PENDING");
  const [status, setStatus] = useState<Status>("loading");
  const [employers, setEmployers] = useState<AdminEmployer[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<AdminEmployer | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setRowError(null);
    try {
      const result = await listEmployers(filter);
      // Oldest request first — first come, first served.
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setEmployers(result);
      setStatus("success");
    } catch (err) {
      setError(describeError(err, "ไม่สามารถโหลดรายชื่อผู้ประกาศงานได้"));
      setStatus("error");
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(emp: AdminEmployer) {
    if (!window.confirm(`อนุมัติ "${emp.companyName ?? emp.fullName}" เป็นผู้ประกาศงาน?`)) return;
    setBusyId(emp.userId);
    setRowError(null);
    try {
      await approveEmployer(emp.userId);
      await load();
    } catch (err) {
      setRowError({ id: emp.userId, message: describeError(err, "อนุมัติไม่สำเร็จ") });
    } finally {
      setBusyId(null);
    }
  }

  const badgeClass = (s: EmployerAccountStatus) =>
    s === "ACTIVE" ? styles.badgeEmployer : s === "PENDING" ? styles.badgePending : styles.badgeRejected;

  if (status === "error") return <ErrorPanel message={error} onRetry={load} />;

  return (
    <div className={`${styles.card} ${styles.animateIn} ${styles.delay2}`}>
      <div className={styles.sectionHeadRow}>
        <div>
          <h2 className={styles.sectionHeading}>ผู้ประกาศงาน</h2>
          <p className={styles.sectionSub}>
            {status === "loading" ? "กำลังโหลด..." : `${employers.length} รายการ`}
          </p>
        </div>
        <select
          className={styles.formSelect}
          style={{ width: "auto", minWidth: 160 }}
          value={filter}
          onChange={(e) => setFilter(e.target.value as EmployerStatusFilter)}
          aria-label="กรองตามสถานะ"
        >
          {EMPLOYER_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {status === "loading" ? (
        <div className={styles.skeletonCard}>
          <div className={styles.skeletonLine} style={{ height: 40 }} />
          <div className={styles.skeletonLine} style={{ height: 40 }} />
          <div className={styles.skeletonLine} style={{ height: 40 }} />
        </div>
      ) : employers.length === 0 ? (
        <p className={styles.emptyState}>
          {filter === "PENDING" ? "ไม่มีผู้ประกาศงานที่รออนุมัติ" : "ไม่พบรายการ"}
        </p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ผู้สมัคร</th>
                <th>บริษัท</th>
                <th>สถานะ</th>
                <th>สมัครเมื่อ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {employers.map((emp) => {
                const busy = busyId === emp.userId;
                const canApprove = emp.accountStatus === "PENDING" || emp.accountStatus === "REJECTED";
                const canReject = emp.accountStatus === "PENDING";
                return (
                  <Fragment key={emp.userId}>
                    <tr>
                      <td>
                        <div className={styles.userCell}>
                          <span className={styles.avatar} aria-hidden="true">
                            {(emp.fullName || emp.email).charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <div className={styles.userName}>{emp.fullName}</div>
                            <div className={styles.userEmail}>{emp.email}</div>
                            {emp.telephone && <div className={styles.userEmail}>{emp.telephone}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.userName}>{emp.companyName ?? "—"}</div>
                        <div className={styles.userEmail}>
                          {emp.companyTaxId ? `เลขผู้เสียภาษี ${emp.companyTaxId}` : "ไม่ได้ระบุเลขผู้เสียภาษี"}
                        </div>
                      </td>
                      <td className={styles.nowrap}>
                        <span className={`${styles.badge} ${badgeClass(emp.accountStatus)}`}>
                          {EMPLOYER_STATUS_LABEL[emp.accountStatus] ?? emp.accountStatus}
                        </span>
                      </td>
                      <td className={styles.nowrap}>{new Date(emp.createdAt).toLocaleDateString("th-TH")}</td>
                      <td className={styles.nowrap}>
                        {canApprove || canReject ? (
                          <div className={styles.rowActions}>
                            {canApprove && (
                              <button
                                type="button"
                                className={styles.btnApprove}
                                onClick={() => handleApprove(emp)}
                                disabled={busy}
                              >
                                {busy ? "กำลังอนุมัติ..." : "อนุมัติ"}
                              </button>
                            )}
                            {canReject && (
                              <button
                                type="button"
                                className={styles.btnReject}
                                onClick={() => setRejecting(emp)}
                                disabled={busy}
                              >
                                ปฏิเสธ
                              </button>
                            )}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                    {rowError?.id === emp.userId && (
                      <tr>
                        <td colSpan={5} style={{ borderBottom: "none", paddingTop: 0 }}>
                          <p className={styles.formError} role="alert">{rowError.message}</p>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rejecting && (
        <RejectEmployerModal employer={rejecting} onClose={() => setRejecting(null)} onRejected={load} />
      )}
    </div>
  );
}

// ===== Resumes tab =====
function ResumesTab() {
  const [status, setStatus] = useState<Status>("loading");
  const [resumes, setResumes] = useState<AdminResume[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const result = await listResumes();
      result.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      setResumes(result);
      setStatus("success");
    } catch (err) {
      setError(extractMessage(err, "ไม่สามารถโหลดรายการเรซูเม่ได้"));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return resumes;
    return resumes.filter(
      (r) =>
        r.userFullName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        r.originalFilename.toLowerCase().includes(q)
    );
  }, [resumes, search]);

  async function handleDelete(resume: AdminResume) {
    if (
      !window.confirm(
        `ยืนยันลบเรซูเม่ "${resume.originalFilename}" ของ ${resume.userFullName}?\nข้อมูลที่เกี่ยวข้องทั้งหมด (คำตอบแบบประเมิน, ทักษะ, คะแนน) จะถูกลบไปด้วยและกู้คืนไม่ได้`
      )
    )
      return;
    setDeletingId(resume.resumeId);
    setRowError(null);
    try {
      await deleteResume(resume.resumeId);
      setResumes((prev) => prev.filter((r) => r.resumeId !== resume.resumeId));
    } catch (err) {
      setRowError({ id: resume.resumeId, message: extractMessage(err, "ลบไม่สำเร็จ") });
    } finally {
      setDeletingId(null);
    }
  }

  if (status === "error") return <ErrorPanel message={error} onRetry={load} />;

  return (
    <div className={`${styles.card} ${styles.animateIn} ${styles.delay2}`}>
      <div className={styles.sectionHeadRow}>
        <div>
          <h2 className={styles.sectionHeading}>เรซูเม่ทั้งหมด</h2>
          <p className={styles.sectionSub}>{resumes.length} รายการ</p>
        </div>
        <input
          className={styles.searchInput}
          placeholder="ค้นหาชื่อ อีเมล หรือไฟล์..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {status === "loading" ? (
        <div className={styles.skeletonCard}>
          <div className={styles.skeletonLine} style={{ height: 40 }} />
          <div className={styles.skeletonLine} style={{ height: 40 }} />
          <div className={styles.skeletonLine} style={{ height: 40 }} />
        </div>
      ) : filtered.length === 0 ? (
        <p className={styles.emptyState}>ไม่พบเรซูเม่ที่ตรงกับคำค้นหา</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>เจ้าของ</th>
                <th>ไฟล์</th>
                <th>ตำแหน่งที่ต้องการ</th>
                <th>คะแนน</th>
                <th>อัปโหลดเมื่อ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <Fragment key={r.resumeId}>
                  <tr>
                    <td>
                      <div className={styles.userName}>{r.userFullName}</div>
                      <div className={styles.userEmail}>{r.userEmail}</div>
                    </td>
                    <td>{r.originalFilename}</td>
                    <td>{r.desiredRoleName || "—"}</td>
                    <td className={styles.nowrap}>
                      {r.assessmentCompleted ? (
                        <span title={`เรซูเม่ ${r.resumeScore} · ประเมิน ${r.assessmentScore} · รวม ${r.finalScore}`}>
                          {r.finalScore?.toFixed(1)}%
                        </span>
                      ) : (
                        <span className={styles.badgeNeutral} style={{ padding: "3px 10px", borderRadius: 999 }}>
                          ยังไม่ประเมิน
                        </span>
                      )}
                    </td>
                    <td className={styles.nowrap}>{new Date(r.uploadedAt).toLocaleDateString("th-TH")}</td>
                    <td className={styles.nowrap}>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          onClick={() => handleDelete(r)}
                          disabled={deletingId === r.resumeId}
                          title="ลบเรซูเม่ (cascade)"
                          aria-label={`ลบเรซูเม่ของ ${r.userFullName}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
                            <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {rowError?.id === r.resumeId && (
                    <tr>
                      <td colSpan={6} style={{ borderBottom: "none", paddingTop: 0 }}>
                        <p className={styles.formError} role="alert">{rowError.message}</p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ===== Jobs tab =====
const EMPTY_JOB_FORM: AdminJobInput = {
  employerId: "",
  companyName: "",
  jobType: "",
  positionName: "",
  requiredSkills: "",
  jobDescription: "",
  duration: "",
  salary: "",
  contactLink: "",
};

function JobFormModal({
  initial,
  jobId,
  onClose,
  onSaved,
}: {
  initial: AdminJobInput;
  jobId: string | null;
  onClose: () => void;
  onSaved: (job: AdminJob) => void;
}) {
  const [form, setForm] = useState<AdminJobInput>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof AdminJobInput>(key: K, value: AdminJobInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const job = jobId ? await updateJob(jobId, form) : await createJob(form);
      onSaved(job);
      onClose();
    } catch (err) {
      setError(extractMessage(err, "บันทึกไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง"));
    } finally {
      setSaving(false);
    }
  }

  // Portaled onto <body> for the same reason as EditUserModal — the
  // .card ancestor's backdrop-filter otherwise traps this fixed overlay
  // inside the tab's own box instead of centering it on the viewport.
  // modalCardWide (vs. the narrower modalCard used by EditUserModal) gives
  // this form's ~9 fields more breathing room so it needs less scrolling.
  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalCard} ${styles.modalCardWide}`} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>{jobId ? "แก้ไขประกาศงาน" : "สร้างประกาศงานใหม่"}</h3>
        {error && (
          <p className={styles.formError} role="alert" style={{ marginBottom: 12 }}>
            {error}
          </p>
        )}
        {!jobId && (
          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="job-employer">Employer ID</label>
            <input
              id="job-employer"
              className={styles.formInput}
              value={form.employerId}
              onChange={(e) => set("employerId", e.target.value)}
              placeholder="uuid ของบริษัทผู้ประกาศ"
            />
          </div>
        )}
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="job-company">ชื่อบริษัท</label>
          <input id="job-company" className={styles.formInput} value={form.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="เช่น บริษัท โค้ดคราฟท์ เทคโนโลยี จำกัด" />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="job-position">ตำแหน่งงาน</label>
          <input id="job-position" className={styles.formInput} value={form.positionName} onChange={(e) => set("positionName", e.target.value)} placeholder="เช่น Backend Developer" />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="job-type">ประเภทงาน</label>
          <input id="job-type" className={styles.formInput} value={form.jobType} onChange={(e) => set("jobType", e.target.value)} placeholder="เช่น Internship" />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="job-skills">ทักษะที่ต้องการ (คั่นด้วยจุลภาค)</label>
          <input
            id="job-skills"
            className={styles.formInput}
            value={form.requiredSkills}
            onChange={(e) => set("requiredSkills", e.target.value)}
            placeholder="React.js,Node.js,PostgreSQL"
          />
          <p className={styles.statSub} style={{ margin: 0 }}>
            ต้องตรงกับชื่อทักษะมาตรฐาน O*NET ในระบบเป๊ะทุกตัวอักษร ไม่งั้นจะถูกปฏิเสธทั้งชุด
          </p>
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="job-desc">รายละเอียดงาน</label>
          <textarea id="job-desc" className={styles.formTextarea} value={form.jobDescription} onChange={(e) => set("jobDescription", e.target.value)} placeholder="อธิบายลักษณะงาน หน้าที่ความรับผิดชอบ และคุณสมบัติที่ต้องการ" />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="job-duration">ระยะเวลา</label>
          <input id="job-duration" className={styles.formInput} value={form.duration} onChange={(e) => set("duration", e.target.value)} placeholder="เช่น 4 เดือน (มิ.ย. - ก.ย.)" />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="job-salary">ค่าตอบแทน</label>
          <input id="job-salary" className={styles.formInput} value={form.salary} onChange={(e) => set("salary", e.target.value)} placeholder="เช่น 15,000 บาท/เดือน" />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="job-link">ลิงก์สมัคร</label>
          <input id="job-link" className={styles.formInput} value={form.contactLink} onChange={(e) => set("contactLink", e.target.value)} placeholder="https://..." />
        </div>
        <div className={styles.modalActions}>
          <button type="button" className={styles.btnGhost} onClick={onClose} disabled={saving}>
            ยกเลิก
          </button>
          <button type="button" className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function JobsTab() {
  const [status, setStatus] = useState<Status>("loading");
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ jobId: string | null; initial: AdminJobInput } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const result = await listJobs();
      result.sort((a, b) => a.companyName.localeCompare(b.companyName, "th"));
      setJobs(result);
      setStatus("success");
    } catch (err) {
      setError(extractMessage(err, "ไม่สามารถโหลดรายการประกาศงานได้"));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (j) => j.companyName.toLowerCase().includes(q) || j.positionName.toLowerCase().includes(q)
    );
  }, [jobs, search]);

  async function handleDelete(job: AdminJob) {
    if (!window.confirm(`ยืนยันลบประกาศงาน "${job.positionName}" ของ ${job.companyName}?`)) return;
    setDeletingId(job.id);
    setRowError(null);
    try {
      await deleteJob(job.id);
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
    } catch (err) {
      setRowError({ id: job.id, message: extractMessage(err, "ลบไม่สำเร็จ") });
    } finally {
      setDeletingId(null);
    }
  }

  function openEdit(job: AdminJob) {
    setModal({
      jobId: job.id,
      initial: {
        employerId: "",
        companyName: job.companyName,
        jobType: job.jobType,
        positionName: job.positionName,
        requiredSkills: job.requiredSkills.join(","),
        jobDescription: job.jobDescription,
        duration: job.duration,
        salary: job.salary,
        contactLink: job.contactLink,
      },
    });
  }

  if (status === "error") return <ErrorPanel message={error} onRetry={load} />;

  return (
    <div className={`${styles.card} ${styles.animateIn} ${styles.delay2}`}>
      <div className={styles.sectionHeadRow}>
        <div>
          <h2 className={styles.sectionHeading}>ประกาศงานทั้งหมด</h2>
          <p className={styles.sectionSub}>{jobs.length} รายการ</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            className={styles.searchInput}
            placeholder="ค้นหาบริษัทหรือตำแหน่ง..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={() => setModal({ jobId: null, initial: EMPTY_JOB_FORM })}
          >
            + สร้างประกาศ
          </button>
        </div>
      </div>

      {status === "loading" ? (
        <div className={styles.skeletonCard}>
          <div className={styles.skeletonLine} style={{ height: 40 }} />
          <div className={styles.skeletonLine} style={{ height: 40 }} />
          <div className={styles.skeletonLine} style={{ height: 40 }} />
        </div>
      ) : filtered.length === 0 ? (
        <p className={styles.emptyState}>ไม่พบประกาศงานที่ตรงกับคำค้นหา</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>บริษัท</th>
                <th>ตำแหน่ง</th>
                <th>ทักษะที่ต้องการ</th>
                <th>ระยะเวลา / ค่าตอบแทน</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((j) => (
                <Fragment key={j.id}>
                  <tr>
                    <td>{j.companyName}</td>
                    <td>
                      <div className={styles.userName}>{j.positionName}</div>
                      <div className={styles.userEmail}>{j.jobType}</div>
                    </td>
                    <td>
                      <div className={styles.skillWrap}>
                        {j.requiredSkills.map((s) => (
                          <span key={s} className={styles.skillChip}>{s}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div>{j.duration}</div>
                      <div className={styles.userEmail}>{j.salary}</div>
                    </td>
                    <td className={styles.nowrap}>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => openEdit(j)}
                          title="แก้ไข"
                          aria-label={`แก้ไข ${j.positionName}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
                            <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69a15.86,15.86,0,0,0,11.31-4.69L227.31,96A16,16,0,0,0,227.31,73.37ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          onClick={() => handleDelete(j)}
                          disabled={deletingId === j.id}
                          title="ลบประกาศ"
                          aria-label={`ลบ ${j.positionName}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
                            <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {rowError?.id === j.id && (
                    <tr>
                      <td colSpan={5} style={{ borderBottom: "none", paddingTop: 0 }}>
                        <p className={styles.formError} role="alert">{rowError.message}</p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <JobFormModal
          initial={modal.initial}
          jobId={modal.jobId}
          onClose={() => setModal(null)}
          onSaved={(job) =>
            setJobs((prev) => {
              const exists = prev.some((j) => j.id === job.id);
              return exists ? prev.map((j) => (j.id === job.id ? job : j)) : [...prev, job];
            })
          }
        />
      )}
    </div>
  );
}

export function AdminDashboardView() {
  const [tab, setTab] = useState<AdminTab>("dashboard");

  return (
    <>
      <div className={`${styles.tabBar} ${styles.animateIn} ${styles.delay1}`} role="tablist">
        {ADMIN_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`${styles.tabBtn} ${tab === t.key ? styles.tabBtnActive : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <DashboardTab />}
      {tab === "users" && <UsersTab />}
      {tab === "employers" && <EmployersTab />}
      {tab === "resumes" && <ResumesTab />}
      {tab === "jobs" && <JobsTab />}
    </>
  );
}
