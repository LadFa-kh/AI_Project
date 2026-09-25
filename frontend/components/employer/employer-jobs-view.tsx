"use client";

// Standalone job-posting list for EMPLOYER accounts — list + create/edit/
// delete, trimmed down from admin-dashboard-view.tsx's JobsTab (same API,
// same styling module reused as-is rather than duplicated).
//
// เดิมหน้านี้เรียก /admin/jobs ซึ่งเปิดให้เฉพาะบทบาท ADMIN บัญชี EMPLOYER
// จึงได้ 403 และเส้นทางนั้นยังคืนประกาศงานของทุกบริษัทโดยไม่กรองเจ้าของ
// ตอนนี้ backend มีเส้นทาง /employer/jobs แล้ว (EmployerJobController)
// ซึ่งดึงรหัสผู้ประกาศจากโทเคนเอง จึงคืนเฉพาะประกาศของผู้ที่ล็อกอินอยู่
// และปฏิเสธการแก้ไขหรือลบประกาศของผู้อื่นด้วยรหัสสถานะ 403
// employerId ไม่ต้องกรอกและไม่ต้องส่ง เพราะ backend เติมให้จากโทเคน

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  listMyJobs as listJobs,
  createMyJob as createJob,
  updateMyJob as updateJob,
  deleteMyJob as deleteJob,
  setJobStatus,
  type EmployerJob as AdminJob,
  type EmployerJobInput as AdminJobInput,
  type JobStatus,
} from "@/lib/employer-service";
import { describeError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import styles from "@/components/admin/admin-dashboard.module.css";

type Status = "loading" | "error" | "success";

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
  return describeError(err, fallback);
}

// ===== Job status (B3 — API_CHANGES.md §5.3) =====

const STATUS_LABEL: Record<JobStatus, string> = {
  DRAFT: "ยังไม่เปิดรับ",
  OPEN: "เปิดรับสมัคร",
  CLOSED: "ปิดรับแล้ว",
};

function statusBadgeClass(status: JobStatus | undefined): string {
  if (status === "OPEN") return styles.badgeEmployer;
  if (status === "DRAFT") return styles.badgePending;
  return styles.badgeNeutral;
}

/** "2026-10-01" -> "1 ต.ค. 2569" (display only; API keeps ISO dates). */
function formatThaiDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function JobStatusModal({
  job,
  onClose,
  onSaved,
}: {
  job: AdminJob;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<"OPEN" | "CLOSED">(job.status === "OPEN" ? "CLOSED" : "OPEN");
  const [openDate, setOpenDate] = useState(job.openDate?.slice(0, 10) ?? "");
  const [closeDate, setCloseDate] = useState(job.closeDate?.slice(0, 10) ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (status === "OPEN" && openDate && closeDate && closeDate < openDate) {
      setError("วันปิดรับต้องไม่ก่อนวันเปิดรับ");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await setJobStatus(
        job.id,
        status === "OPEN"
          ? { status, ...(openDate ? { openDate } : {}), ...(closeDate ? { closeDate } : {}) }
          : { status }
      );
      onSaved();
      onClose();
    } catch (err) {
      setError(extractMessage(err, "เปลี่ยนสถานะไม่สำเร็จ กรุณาลองใหม่"));
    } finally {
      setSaving(false);
    }
  }

  const futureOpen = status === "OPEN" && !!openDate && openDate > todayIso();

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>สถานะประกาศ: {job.positionName}</h3>
        {error && (
          <p className={styles.formError} role="alert" style={{ marginBottom: 12 }}>
            {error}
          </p>
        )}
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="js-status">สถานะ</label>
          <select
            id="js-status"
            className={styles.formSelect}
            value={status}
            onChange={(e) => setStatus(e.target.value as "OPEN" | "CLOSED")}
          >
            <option value="OPEN">เปิดรับสมัคร</option>
            <option value="CLOSED">ปิดรับ</option>
          </select>
        </div>
        {status === "OPEN" && (
          <>
            <div className={styles.grid2}>
              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="js-open">วันเปิดรับ (ไม่บังคับ)</label>
                <input id="js-open" type="date" className={styles.formInput} value={openDate} onChange={(e) => setOpenDate(e.target.value)} />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="js-close">วันปิดรับ (ไม่บังคับ)</label>
                <input id="js-close" type="date" className={styles.formInput} value={closeDate} min={openDate || undefined} onChange={(e) => setCloseDate(e.target.value)} />
              </div>
            </div>
            <p className={styles.statSub} style={{ margin: 0 }}>
              {futureOpen
                ? "วันเปิดรับอยู่ในอนาคต ประกาศจะเป็น \"ยังไม่เปิดรับ\" และเปิดเองเมื่อถึงวัน"
                : "ไม่ใส่วันเปิดรับ = เปิดทันที · ถึงวันปิดรับ ระบบจะปิดประกาศให้อัตโนมัติ"}
            </p>
          </>
        )}
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

function emptyJobForm(employerId: string): AdminJobInput {
  return {
    employerId,
    companyName: "",
    jobType: "",
    positionName: "",
    requiredSkills: "",
    jobDescription: "",
    duration: "",
    salary: "",
    contactLink: "",
    openDate: "",
    closeDate: "",
  };
}

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
    if (!jobId && form.openDate && form.closeDate && form.closeDate < form.openDate) {
      setError("วันปิดรับต้องไม่ก่อนวันเปิดรับ");
      setSaving(false);
      return;
    }
    // Dates are only set on create; later changes go through PATCH /jobs/{id}/status.
    // Empty date strings are dropped so the backend doesn't try to parse "".
    const { openDate, closeDate, ...rest } = form;
    const payload: AdminJobInput = {
      ...rest,
      ...(!jobId && openDate ? { openDate } : {}),
      ...(!jobId && closeDate ? { closeDate } : {}),
    };
    try {
      const job = jobId ? await updateJob(jobId, payload) : await createJob(payload);
      onSaved(job);
      onClose();
    } catch (err) {
      setError(extractMessage(err, "บันทึกไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง"));
    } finally {
      setSaving(false);
    }
  }

  // Portaled onto <body> — same reason as admin-dashboard-view.tsx's
  // modals: the .card ancestor's backdrop-filter otherwise traps this
  // fixed overlay inside the tab's own box instead of centering it on the
  // viewport.
  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalCard} ${styles.modalCardWide}`} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>{jobId ? "แก้ไขประกาศงาน" : "สร้างประกาศงานใหม่"}</h3>
        {error && (
          <p className={styles.formError} role="alert" style={{ marginBottom: 12 }}>
            {error}
          </p>
        )}
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="ej-company">ชื่อบริษัท</label>
          <input id="ej-company" className={styles.formInput} value={form.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="เช่น บริษัท โค้ดคราฟท์ เทคโนโลยี จำกัด" />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="ej-position">ตำแหน่งงาน</label>
          <input id="ej-position" className={styles.formInput} value={form.positionName} onChange={(e) => set("positionName", e.target.value)} placeholder="เช่น Backend Developer" />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="ej-type">ประเภทงาน</label>
          <input id="ej-type" className={styles.formInput} value={form.jobType} onChange={(e) => set("jobType", e.target.value)} placeholder="เช่น Internship" />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="ej-skills">ทักษะที่ต้องการ (คั่นด้วยจุลภาค)</label>
          <input
            id="ej-skills"
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
          <label className={styles.formLabel} htmlFor="ej-desc">รายละเอียดงาน</label>
          <textarea id="ej-desc" className={styles.formTextarea} value={form.jobDescription} onChange={(e) => set("jobDescription", e.target.value)} placeholder="อธิบายลักษณะงาน หน้าที่ความรับผิดชอบ และคุณสมบัติที่ต้องการ" />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="ej-duration">ระยะเวลา</label>
          <input id="ej-duration" className={styles.formInput} value={form.duration} onChange={(e) => set("duration", e.target.value)} placeholder="เช่น 4 เดือน (มิ.ย. - ก.ย.)" />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="ej-salary">ค่าตอบแทน</label>
          <input id="ej-salary" className={styles.formInput} value={form.salary} onChange={(e) => set("salary", e.target.value)} placeholder="เช่น 15,000 บาท/เดือน" />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="ej-link">ลิงก์สมัคร</label>
          <input id="ej-link" className={styles.formInput} value={form.contactLink} onChange={(e) => set("contactLink", e.target.value)} placeholder="https://..." />
        </div>
        {!jobId && (
          <>
            <div className={styles.grid2}>
              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="ej-open">วันเปิดรับ (ไม่บังคับ)</label>
                <input id="ej-open" type="date" className={styles.formInput} value={form.openDate ?? ""} onChange={(e) => set("openDate", e.target.value)} />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="ej-close">วันปิดรับ (ไม่บังคับ)</label>
                <input id="ej-close" type="date" className={styles.formInput} value={form.closeDate ?? ""} min={form.openDate || undefined} onChange={(e) => set("closeDate", e.target.value)} />
              </div>
            </div>
            <p className={styles.statSub} style={{ margin: 0 }}>
              ไม่ใส่วันเปิดรับ = เปิดทันที · ถ้าวันเปิดรับอยู่ในอนาคต ประกาศจะเปิดเองเมื่อถึงวัน
            </p>
          </>
        )}
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

export function EmployerJobsView() {
  const { user } = useAuth();
  const employerId = user?.userId ?? "";

  const [status, setStatus] = useState<Status>("loading");
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ jobId: string | null; initial: AdminJobInput } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
  const [statusJob, setStatusJob] = useState<AdminJob | null>(null);

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
        employerId,
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
          <h2 className={styles.sectionHeading}>ประกาศงานของฉัน</h2>
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
            onClick={() => setModal({ jobId: null, initial: emptyJobForm(employerId) })}
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
                <th>สถานะ</th>
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
                      {j.status ? (
                        <span className={`${styles.badge} ${statusBadgeClass(j.status)}`}>{STATUS_LABEL[j.status]}</span>
                      ) : (
                        <span className={styles.userEmail}>—</span>
                      )}
                      {(j.openDate || j.closeDate) && (
                        <div className={styles.userEmail} style={{ marginTop: 4 }}>
                          {formatThaiDate(j.openDate) || "…"} – {formatThaiDate(j.closeDate) || "…"}
                        </div>
                      )}
                    </td>
                    <td className={styles.nowrap}>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => setStatusJob(j)}
                          title="เปิด/ปิดรับสมัคร"
                          aria-label={`เปิด/ปิดรับสมัคร ${j.positionName}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
                            <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z" />
                          </svg>
                        </button>
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

      {statusJob && (
        <JobStatusModal job={statusJob} onClose={() => setStatusJob(null)} onSaved={load} />
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
