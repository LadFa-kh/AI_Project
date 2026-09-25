"use client";

// STUDENT — internship history (API_CHANGES.md §5.6 B6).
// Rules from the backend:
// - a record points at a job in the system (jobId), or an off-system company (companyName)
// - the student may only set CANCELLED on in-system records; the company moves the rest
// - off-system records (companyId = null) are fully student-managed
// - delete only while APPLIED / CANCELLED

import { Fragment, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { describeError } from "@/lib/api-client";
import { getAllWorkplaces, type Workplace } from "@/lib/workplace-service";
import {
  INTERNSHIP_STATUSES,
  INTERNSHIP_STATUS_LABEL,
  canStudentDelete,
  createMyInternship,
  deleteMyInternship,
  isOffSystem,
  listMyInternships,
  updateMyInternship,
  type Internship,
  type InternshipCreateInput,
  type InternshipStatus,
  type InternshipUpdateInput,
} from "@/lib/internship-service";
import { formatThaiDateRange } from "@/lib/date-format";
import { InternshipStatusBadge } from "./internship-status-badge";
import styles from "@/components/admin/admin-dashboard.module.css";

type Status = "loading" | "error" | "success";
type Mode = "job" | "offsystem";

type FormState = {
  jobId: string;
  companyName: string;
  positionName: string;
  startDate: string;
  endDate: string;
  supervisorName: string;
  supervisorEmail: string;
  studentNote: string;
  status: InternshipStatus;
};

const EMPTY_FORM: FormState = {
  jobId: "",
  companyName: "",
  positionName: "",
  startDate: "",
  endDate: "",
  supervisorName: "",
  supervisorEmail: "",
  studentNote: "",
  status: "APPLIED",
};

/** Drops empty strings so the backend never has to parse "" as a date/email. */
function compact<T extends Record<string, string | undefined>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  (Object.keys(obj) as (keyof T)[]).forEach((k) => {
    const v = obj[k]?.trim();
    if (v) out[k] = v as T[keyof T];
  });
  return out;
}

function InternshipFormModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: Internship | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const offSystemEdit = !!editing && isOffSystem(editing);
  const [mode, setMode] = useState<Mode>(editing ? (offSystemEdit ? "offsystem" : "job") : "job");
  const [form, setForm] = useState<FormState>(
    editing
      ? {
          jobId: editing.jobId ?? "",
          companyName: editing.companyName ?? "",
          positionName: editing.positionName ?? "",
          startDate: editing.startDate?.slice(0, 10) ?? "",
          endDate: editing.endDate?.slice(0, 10) ?? "",
          supervisorName: editing.supervisorName ?? "",
          supervisorEmail: editing.supervisorEmail ?? "",
          studentNote: editing.studentNote ?? "",
          status: editing.status,
        }
      : EMPTY_FORM
  );
  const [jobs, setJobs] = useState<Workplace[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Job picker source — only needed when creating an in-system record.
  useEffect(() => {
    if (editing) return;
    let cancelled = false;
    getAllWorkplaces()
      .then((list) => {
        if (!cancelled) setJobs(list);
      })
      .catch(() => {
        if (!cancelled) setJobs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [editing]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function handleSave() {
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError("วันสิ้นสุดต้องไม่ก่อนวันเริ่ม");
      return;
    }
    if (!editing && mode === "job" && !form.jobId) {
      setError("กรุณาเลือกประกาศงาน");
      return;
    }
    if (mode === "offsystem" && (!form.companyName.trim() || !form.positionName.trim())) {
      setError("กรุณากรอกชื่อบริษัทและตำแหน่ง");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editing) {
        const base = compact({
          startDate: form.startDate,
          endDate: form.endDate,
          studentNote: form.studentNote,
          ...(offSystemEdit
            ? {
                companyName: form.companyName,
                positionName: form.positionName,
                supervisorName: form.supervisorName,
                supervisorEmail: form.supervisorEmail,
              }
            : {}),
        });
        const input: InternshipUpdateInput = offSystemEdit && form.status !== editing.status ? { ...base, status: form.status } : base;
        await updateMyInternship(editing.id, input);
      } else {
        const input: InternshipCreateInput =
          mode === "job"
            ? compact({ jobId: form.jobId, startDate: form.startDate, endDate: form.endDate, studentNote: form.studentNote })
            : compact({
                companyName: form.companyName,
                positionName: form.positionName,
                startDate: form.startDate,
                endDate: form.endDate,
                supervisorName: form.supervisorName,
                supervisorEmail: form.supervisorEmail,
                studentNote: form.studentNote,
              });
        await createMyInternship(input);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(describeError(err, "บันทึกไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง"));
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalCard} ${styles.modalCardWide}`} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>{editing ? "แก้ไขประวัติฝึกงาน" : "เพิ่มประวัติฝึกงาน"}</h3>
        {error && (
          <p className={styles.formError} role="alert" style={{ marginBottom: 12 }}>
            {error}
          </p>
        )}

        {!editing && (
          <div className={styles.tabBar} role="tablist" style={{ marginBottom: 16 }}>
            <button type="button" role="tab" aria-selected={mode === "job"} className={`${styles.tabBtn} ${mode === "job" ? styles.tabBtnActive : ""}`} onClick={() => setMode("job")}>
              ประกาศงานในระบบ
            </button>
            <button type="button" role="tab" aria-selected={mode === "offsystem"} className={`${styles.tabBtn} ${mode === "offsystem" ? styles.tabBtnActive : ""}`} onClick={() => setMode("offsystem")}>
              บริษัทนอกระบบ
            </button>
          </div>
        )}

        {!editing && mode === "job" && (
          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="in-job">ประกาศงาน</label>
            <select id="in-job" className={styles.formSelect} value={form.jobId} onChange={(e) => set("jobId", e.target.value)} disabled={jobs === null}>
              <option value="">{jobs === null ? "กำลังโหลด..." : "— เลือกประกาศงาน —"}</option>
              {jobs?.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.positionName} — {j.companyName}
                </option>
              ))}
            </select>
          </div>
        )}

        {editing && !offSystemEdit && (
          <p className={styles.statSub} style={{ marginTop: 0, marginBottom: 14 }}>
            {editing.positionName ?? "-"} — {editing.companyName} · สถานะของบริษัทในระบบจะถูกอัปเดตโดยบริษัท
          </p>
        )}

        {mode === "offsystem" && (
          <div className={styles.grid2}>
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="in-company">ชื่อบริษัท</label>
              <input id="in-company" className={styles.formInput} value={form.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="บริษัท ตัวอย่าง จำกัด" />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="in-position">ตำแหน่ง</label>
              <input id="in-position" className={styles.formInput} value={form.positionName} onChange={(e) => set("positionName", e.target.value)} placeholder="Backend Intern" />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="in-sup">ชื่อพี่เลี้ยง (ไม่บังคับ)</label>
              <input id="in-sup" className={styles.formInput} value={form.supervisorName} onChange={(e) => set("supervisorName", e.target.value)} />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="in-supmail">อีเมลพี่เลี้ยง (ไม่บังคับ)</label>
              <input id="in-supmail" type="email" className={styles.formInput} value={form.supervisorEmail} onChange={(e) => set("supervisorEmail", e.target.value)} />
            </div>
            {offSystemEdit && (
              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="in-status">สถานะ</label>
                <select id="in-status" className={styles.formSelect} value={form.status} onChange={(e) => set("status", e.target.value as InternshipStatus)}>
                  {INTERNSHIP_STATUSES.map((s) => (
                    <option key={s} value={s}>{INTERNSHIP_STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <div className={styles.grid2}>
          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="in-start">วันเริ่มฝึกงาน</label>
            <input id="in-start" type="date" className={styles.formInput} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="in-end">วันสิ้นสุด</label>
            <input id="in-end" type="date" className={styles.formInput} value={form.endDate} min={form.startDate || undefined} onChange={(e) => set("endDate", e.target.value)} />
          </div>
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="in-note">บันทึกของฉัน (ไม่บังคับ)</label>
          <textarea id="in-note" className={styles.formTextarea} value={form.studentNote} onChange={(e) => set("studentNote", e.target.value)} />
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.btnGhost} onClick={onClose} disabled={saving}>ยกเลิก</button>
          <button type="button" className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function MyInternshipsView() {
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<Internship[]>([]);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [modal, setModal] = useState<{ editing: Internship | null } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    listMyInternships()
      .then((list) => {
        if (cancelled) return;
        setItems(list);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(describeError(err, "ไม่สามารถโหลดประวัติฝึกงานได้"));
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  async function handleCancel(item: Internship) {
    if (!window.confirm(`ยกเลิกการฝึกงาน "${item.positionName ?? ""}" ที่ ${item.companyName}?`)) return;
    setBusyId(item.id);
    setRowError(null);
    try {
      await updateMyInternship(item.id, { status: "CANCELLED" });
      reload();
    } catch (err) {
      setRowError({ id: item.id, message: describeError(err, "ยกเลิกไม่สำเร็จ") });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(item: Internship) {
    if (!window.confirm(`ลบประวัติฝึกงานที่ ${item.companyName}? กู้คืนไม่ได้`)) return;
    setBusyId(item.id);
    setRowError(null);
    try {
      await deleteMyInternship(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      setRowError({ id: item.id, message: describeError(err, "ลบไม่สำเร็จ") });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className={`${styles.card} ${styles.animateIn} ${styles.delay2}`}>
      <div className={styles.sectionHeadRow}>
        <div>
          <h2 className={styles.sectionHeading}>ประวัติฝึกงานของฉัน</h2>
          <p className={styles.sectionSub}>{items.length} รายการ</p>
        </div>
        <button type="button" className={styles.refreshBtn} onClick={() => setModal({ editing: null })}>
          + เพิ่มประวัติฝึกงาน
        </button>
      </div>

      {status === "error" ? (
        <div style={{ position: "relative", zIndex: 1 }}>
          <p className={styles.formError} role="alert">{error}</p>
          <button type="button" className={styles.btnGhost} style={{ marginTop: 12 }} onClick={() => { setStatus("loading"); reload(); }}>
            ลองใหม่
          </button>
        </div>
      ) : status === "loading" ? (
        <div className={styles.skeletonCard}>
          <div className={styles.skeletonLine} style={{ height: 40 }} />
          <div className={styles.skeletonLine} style={{ height: 40 }} />
        </div>
      ) : items.length === 0 ? (
        <p className={styles.emptyState}>ยังไม่มีประวัติฝึกงาน — กด &quot;เพิ่มประวัติฝึกงาน&quot; เพื่อบันทึกที่ที่คุณสมัครหรือฝึกงานอยู่</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>บริษัท / ตำแหน่ง</th>
                <th>ช่วงเวลา</th>
                <th>สถานะ</th>
                <th>หมายเหตุจากบริษัท</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => {
                const canCancel = !isOffSystem(i) && (i.status === "APPLIED" || i.status === "ACCEPTED");
                return (
                  <Fragment key={i.id}>
                    <tr>
                      <td>
                        <div className={styles.userName}>{i.companyName}</div>
                        <div className={styles.userEmail}>
                          {i.positionName ?? "-"}
                          {isOffSystem(i) ? " · นอกระบบ" : ""}
                        </div>
                      </td>
                      <td className={styles.nowrap}>{formatThaiDateRange(i.startDate, i.endDate)}</td>
                      <td className={styles.nowrap}><InternshipStatusBadge status={i.status} /></td>
                      <td>{i.companyNote || <span className={styles.userEmail}>—</span>}</td>
                      <td className={styles.nowrap}>
                        <div className={styles.rowActions}>
                          <button type="button" className={styles.actionBtn} onClick={() => setModal({ editing: i })} disabled={busyId === i.id} title="แก้ไข" aria-label={`แก้ไข ${i.companyName}`}>
                            <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                              <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69a15.86,15.86,0,0,0,11.31-4.69L227.31,96A16,16,0,0,0,227.31,73.37ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z" />
                            </svg>
                          </button>
                          {canCancel && (
                            <button type="button" className={styles.btnGhost} onClick={() => handleCancel(i)} disabled={busyId === i.id}>
                              ยกเลิก
                            </button>
                          )}
                          {canStudentDelete(i) && (
                            <button type="button" className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => handleDelete(i)} disabled={busyId === i.id} title="ลบ" aria-label={`ลบ ${i.companyName}`}>
                              <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                                <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192Z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {rowError?.id === i.id && (
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

      {modal && <InternshipFormModal editing={modal.editing} onClose={() => setModal(null)} onSaved={reload} />}
    </div>
  );
}
