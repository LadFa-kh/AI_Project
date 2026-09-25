"use client";

// EMPLOYER — interns linked to this company (API_CHANGES.md §5.6 B6).
// GET /employer/internships · PATCH /employer/internships/{id} { status, companyNote }

import { Fragment, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { describeError } from "@/lib/api-client";
import {
  INTERNSHIP_STATUSES,
  INTERNSHIP_STATUS_LABEL,
  listCompanyInternships,
  updateCompanyInternship,
  type Internship,
  type InternshipStatus,
} from "@/lib/internship-service";
import { formatThaiDateRange } from "@/lib/date-format";
import { InternshipStatusBadge } from "@/components/internships/internship-status-badge";
import styles from "@/components/admin/admin-dashboard.module.css";

type Status = "loading" | "error" | "success";

function UpdateModal({ item, onClose, onSaved }: { item: Internship; onClose: () => void; onSaved: (i: Internship) => void }) {
  const [status, setStatus] = useState<InternshipStatus>(item.status);
  const [note, setNote] = useState(item.companyNote ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const updated = await updateCompanyInternship(item.id, { status, ...(note.trim() ? { companyNote: note.trim() } : {}) });
      onSaved(updated && typeof updated === "object" && "id" in updated ? updated : { ...item, status, companyNote: note.trim() || null });
      onClose();
    } catch (err) {
      setError(describeError(err, "อัปเดตสถานะไม่สำเร็จ"));
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>อัปเดตสถานะ: {item.studentName}</h3>
        {error && <p className={styles.formError} role="alert" style={{ marginBottom: 12 }}>{error}</p>}
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="ei-status">สถานะ</label>
          <select id="ei-status" className={styles.formSelect} value={status} onChange={(e) => setStatus(e.target.value as InternshipStatus)}>
            {INTERNSHIP_STATUSES.filter((s) => s !== "CANCELLED").map((s) => (
              <option key={s} value={s}>{INTERNSHIP_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="ei-note">หมายเหตุถึงนักศึกษา (ไม่บังคับ)</label>
          <textarea id="ei-note" className={styles.formTextarea} value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น ผ่านการคัดเลือก เริ่มงาน 1 ต.ค." />
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

export function EmployerInternshipsView() {
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<Internship[]>([]);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<InternshipStatus | "ALL">("ALL");
  const [editing, setEditing] = useState<Internship | null>(null);

  useEffect(() => {
    let cancelled = false;
    listCompanyInternships()
      .then((list) => {
        if (cancelled) return;
        setItems(list);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(describeError(err, "ไม่สามารถโหลดรายชื่อผู้ฝึกงานได้"));
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const filtered = useMemo(() => (filter === "ALL" ? items : items.filter((i) => i.status === filter)), [items, filter]);

  return (
    <div className={`${styles.card} ${styles.animateIn} ${styles.delay2}`}>
      <div className={styles.sectionHeadRow}>
        <div>
          <h2 className={styles.sectionHeading}>ผู้ฝึกงานของบริษัท</h2>
          <p className={styles.sectionSub}>นักศึกษาที่บันทึกประวัติฝึกงานกับประกาศหรือบริษัทของคุณ</p>
        </div>
        <select className={styles.searchInput} value={filter} onChange={(e) => setFilter(e.target.value as InternshipStatus | "ALL")} aria-label="กรองตามสถานะ">
          <option value="ALL">ทุกสถานะ</option>
          {INTERNSHIP_STATUSES.map((s) => (
            <option key={s} value={s}>{INTERNSHIP_STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>

      {status === "error" ? (
        <div style={{ position: "relative", zIndex: 1 }}>
          <p className={styles.formError} role="alert">{error}</p>
          <button type="button" className={styles.btnGhost} style={{ marginTop: 12 }} onClick={() => { setStatus("loading"); setReloadKey((k) => k + 1); }}>
            ลองใหม่
          </button>
        </div>
      ) : status === "loading" ? (
        <div className={styles.skeletonCard}>
          <div className={styles.skeletonLine} style={{ height: 40 }} />
          <div className={styles.skeletonLine} style={{ height: 40 }} />
        </div>
      ) : filtered.length === 0 ? (
        <p className={styles.emptyState}>ยังไม่มีผู้ฝึกงาน{filter !== "ALL" ? "ในสถานะนี้" : ""}</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>นักศึกษา</th>
                <th>ตำแหน่ง</th>
                <th>ช่วงเวลา</th>
                <th>สถานะ</th>
                <th>หมายเหตุ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <Fragment key={i.id}>
                  <tr>
                    <td>
                      <div className={styles.userName}>{i.studentName}</div>
                      {i.studentEmail && <div className={styles.userEmail}>{i.studentEmail}</div>}
                    </td>
                    <td>{i.positionName ?? "-"}</td>
                    <td className={styles.nowrap}>{formatThaiDateRange(i.startDate, i.endDate)}</td>
                    <td className={styles.nowrap}><InternshipStatusBadge status={i.status} /></td>
                    <td>
                      {i.studentNote && <div className={styles.userEmail}>นักศึกษา: {i.studentNote}</div>}
                      {i.companyNote && <div className={styles.userEmail}>บริษัท: {i.companyNote}</div>}
                    </td>
                    <td className={styles.nowrap}>
                      <button type="button" className={styles.btnGhost} onClick={() => setEditing(i)} disabled={i.status === "CANCELLED"}>
                        อัปเดตสถานะ
                      </button>
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <UpdateModal
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={(u) => setItems((prev) => prev.map((i) => (i.id === u.id ? u : i)))}
        />
      )}
    </div>
  );
}
