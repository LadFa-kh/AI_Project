"use client";

// Admin tabs added in round B4/B6/B7/B8 (API_CHANGES.md §5):
// - CompaniesTab  : list/search companies, suspend/activate, import CSV/XLSX (dry-run → confirm), import history
// - UsageTab      : usage summary + usage log (shapes undocumented → generic table)
// - InternshipsTab: all internship records (read-only)
// Same styling module as the rest of /admin.

import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { describeError } from "@/lib/api-client";
import {
  downloadImportTemplate,
  getUsageCost,
  getUsageSummary,
  importCompanies,
  listAdminCompanies,
  listImports,
  listUsage,
  parseImportErrors,
  setCompanyStatus,
  type AdminCompany,
  type CostRow,
  type UsageCost,
  type ImportLog,
  type ImportResult,
  type Paged,
  type UsageLogRow,
  type UsageSummaryRow,
} from "@/lib/admin-ops-service";
import {
  INTERNSHIP_STATUSES,
  INTERNSHIP_STATUS_LABEL,
  listAllInternships,
  type Internship,
} from "@/lib/internship-service";
import { formatThaiDateRange } from "@/lib/date-format";
import { InternshipStatusBadge } from "@/components/internships/internship-status-badge";
import styles from "./admin-dashboard.module.css";

// ---------- shared bits ----------

function Pager({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className={styles.modalActions} style={{ justifyContent: "center", alignItems: "center", position: "relative", zIndex: 1 }}>
      <button type="button" className={styles.btnGhost} disabled={page <= 0} onClick={() => onPage(page - 1)}>← ก่อนหน้า</button>
      <span className={styles.statSub}>หน้า {page + 1} / {totalPages}</span>
      <button type="button" className={styles.btnGhost} disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)}>ถัดไป →</button>
    </div>
  );
}

const ACTION_LABEL: Record<string, string> = {
  RESUME_UPLOAD: "อัปโหลดเรซูเม่",
  ASSESSMENT_SUBMIT: "ส่งแบบประเมิน",
};

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

// ---------- Companies + import (B4/B7) ----------

const COMPANY_STATUS_LABEL: Record<string, string> = { ACTIVE: "ใช้งาน", PENDING: "รออนุมัติ", SUSPENDED: "ระงับ" };

function SuspendModal({ company, onClose, onDone }: { company: AdminCompany; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!reason.trim()) {
      setError("กรุณาระบุเหตุผล");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await setCompanyStatus(company.id, "SUSPENDED", reason.trim());
      onDone();
      onClose();
    } catch (err) {
      setError(describeError(err, "ระงับบริษัทไม่สำเร็จ"));
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>ระงับบริษัท: {company.nameTh}</h3>
        <p className={styles.statSub} style={{ marginTop: 0 }}>ระหว่างระงับ หน้าบริษัทสาธารณะจะไม่แสดง</p>
        {error && <p className={styles.formError} role="alert" style={{ marginBottom: 12 }}>{error}</p>}
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="sc-reason">เหตุผล</label>
          <textarea id="sc-reason" className={styles.formTextarea} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <div className={styles.modalActions}>
          <button type="button" className={styles.btnGhost} onClick={onClose} disabled={saving}>ยกเลิก</button>
          <button type="button" className={styles.btnDanger} onClick={submit} disabled={saving}>{saving ? "กำลังบันทึก..." : "ระงับ"}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ImportPanel({ onImported }: { onImported: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<"check" | "commit" | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  function pick(f: File | null) {
    setResult(null);
    setMessage("");
    setError("");
    if (!f) return setFile(null);
    if (!/\.(csv|xlsx)$/i.test(f.name)) {
      setFile(null);
      setError("รองรับเฉพาะไฟล์ .csv หรือ .xlsx");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setFile(null);
      setError("ไฟล์ต้องไม่เกิน 5 MB");
      return;
    }
    setFile(f);
  }

  async function run(dryRun: boolean) {
    if (!file) return;
    setBusy(dryRun ? "check" : "commit");
    setError("");
    try {
      const { message: msg, result: r } = await importCompanies(file, dryRun);
      setResult(r);
      setMessage(msg);
      if (!dryRun) {
        onImported();
      }
    } catch (err) {
      setError(describeError(err, "นำเข้าไฟล์ไม่สำเร็จ"));
    } finally {
      setBusy(null);
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setMessage("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const canCommit = !!result && result.dryRun && result.created + result.updated > 0;

  return (
    <div className={`${styles.card} ${styles.animateIn} ${styles.delay2}`}>
      <div className={styles.sectionHeadRow}>
        <div>
          <h2 className={styles.sectionHeading}>นำเข้าบริษัทจากไฟล์</h2>
          <p className={styles.sectionSub}>1) ดาวน์โหลด template 2) ตรวจไฟล์ (ยังไม่บันทึก) 3) ยืนยันนำเข้า</p>
        </div>
        <button
          type="button"
          className={styles.btnGhost}
          onClick={() => {
            setError("");
            downloadImportTemplate().catch((err: unknown) => setError(describeError(err, "ดาวน์โหลด template ไม่สำเร็จ")));
          }}
        >
          ดาวน์โหลด template (CSV)
        </button>
      </div>

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        <p className={styles.statSub} style={{ margin: 0 }}>
          ถ้าแก้ไฟล์ใน Excel ให้ Save เป็น &quot;CSV UTF-8&quot; ไม่งั้นภาษาไทยจะเพี้ยน (หรืออัปโหลด .xlsx ได้เลย) · ไม่เกิน 5 MB
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className={styles.formInput}
            style={{ maxWidth: 360 }}
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
            aria-label="เลือกไฟล์บริษัท"
          />
          <button type="button" className={styles.refreshBtn} disabled={!file || busy !== null} onClick={() => run(true)}>
            {busy === "check" ? "กำลังตรวจ..." : "ตรวจไฟล์"}
          </button>
          {canCommit && (
            <button type="button" className={styles.btnPrimary} disabled={busy !== null} onClick={() => run(false)}>
              {busy === "commit" ? "กำลังนำเข้า..." : "ยืนยันนำเข้า"}
            </button>
          )}
          {(file || result) && (
            <button type="button" className={styles.btnGhost} disabled={busy !== null} onClick={reset}>ล้าง</button>
          )}
        </div>

        {error && <p className={styles.formError} role="alert">{error}</p>}

        {result && (
          <>
            <p className={styles.statSub} role="status" style={{ margin: 0, color: result.dryRun ? undefined : "var(--nocturne-success-text)" }}>
              {message || (result.dryRun ? "ตรวจไฟล์เสร็จ (ยังไม่บันทึก)" : "นำเข้าเรียบร้อย")}
            </p>
            <div className={styles.statGrid}>
              {[
                ["ทั้งหมด", result.totalRows],
                [result.dryRun ? "จะสร้างใหม่" : "สร้างใหม่", result.created],
                [result.dryRun ? "จะอัปเดต" : "อัปเดต", result.updated],
                ["ข้าม", result.skipped],
              ].map(([label, value]) => (
                <div key={String(label)} className={`${styles.card} ${styles.statCard}`}>
                  <span className={styles.statLabel}>{label}</span>
                  <span className={styles.statValue}>{value}</span>
                </div>
              ))}
            </div>
            {result.errors.length > 0 && (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr><th>แถว</th><th>ช่อง</th><th>ปัญหา</th></tr>
                  </thead>
                  <tbody>
                    {result.errors.map((e, i) => (
                      <tr key={i}>
                        <td>{e.row}</td>
                        <td>{e.field ?? "—"}</td>
                        <td>{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className={styles.statSub}>เลขแถวนับหัวตารางเป็นแถวที่ 1 — แถวที่มีปัญหาจะถูกข้าม แก้ไฟล์แล้วตรวจใหม่ได้</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ImportHistory({ reloadKey }: { reloadKey: number }) {
  const [data, setData] = useState<Paged<ImportLog> | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listImports(page)
      .then((d) => { if (!cancelled) { setData(d); setError(""); } })
      .catch((err: unknown) => { if (!cancelled) setError(describeError(err, "โหลดประวัติการนำเข้าไม่ได้")); });
    return () => { cancelled = true; };
  }, [page, reloadKey]);

  return (
    <div className={`${styles.card} ${styles.animateIn} ${styles.delay3}`}>
      <div className={styles.sectionHeadRow}>
        <h2 className={styles.sectionHeading}>ประวัติการนำเข้า</h2>
      </div>
      {error ? <p className={styles.formError} role="alert">{error}</p> : !data ? (
        <div className={styles.skeletonCard}><div className={styles.skeletonLine} style={{ height: 40 }} /></div>
      ) : (
        <>
          {data.content.length === 0 ? (
            <p className={styles.emptyState}>ยังไม่มีประวัติการนำเข้า</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr><th>วันเวลา</th><th>ไฟล์</th><th>แบบ</th><th>แถว</th><th>เพิ่มใหม่</th><th>อัปเดต</th><th>ข้าม</th><th>ข้อผิดพลาด</th><th>ผู้นำเข้า</th></tr>
                </thead>
                <tbody>
                  {data.content.map((log) => {
                    const errors = openId === log.id ? parseImportErrors(log.errorsJson) : [];
                    return (
                      <Fragment key={log.id}>
                        <tr>
                          <td className={styles.nowrap}>{formatDateTime(log.createdAt)}</td>
                          <td>{log.fileName}</td>
                          <td>
                            <span className={`${styles.badge} ${log.dryRun ? styles.badgeNeutral : styles.badgeEmployer}`}>
                              {log.dryRun ? "ตรวจอย่างเดียว" : "นำเข้าจริง"}
                            </span>
                          </td>
                          <td>{log.totalRows}</td>
                          <td>{log.created}</td>
                          <td>{log.updated}</td>
                          <td>{log.skipped}</td>
                          <td>
                            {log.errorCount > 0 ? (
                              <button type="button" className={styles.btnGhost} onClick={() => setOpenId(openId === log.id ? null : log.id)} aria-expanded={openId === log.id}>
                                {log.errorCount} รายการ {openId === log.id ? "▲" : "▼"}
                              </button>
                            ) : (
                              "0"
                            )}
                          </td>
                          <td>{log.importedBy ?? "—"}</td>
                        </tr>
                        {openId === log.id && (
                          <tr>
                            <td colSpan={9}>
                              {errors.length === 0 ? (
                                <span className={styles.userEmail}>ไม่มีรายละเอียด</span>
                              ) : (
                                errors.map((e, i) => (
                                  <div key={i} className={styles.userEmail}>
                                    แถว {e.row}{e.field ? ` · ${e.field}` : ""}: {e.message}
                                  </div>
                                ))
                              )}
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
          <Pager page={data.page} totalPages={data.totalPages} onPage={setPage} />
        </>
      )}
    </div>
  );
}

export function CompaniesTab() {
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Paged<AdminCompany> | null>(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [suspending, setSuspending] = useState<AdminCompany | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listAdminCompanies({ q: query, status: statusFilter, page })
      .then((d) => { if (!cancelled) { setData(d); setError(""); } })
      .catch((err: unknown) => { if (!cancelled) setError(describeError(err, "ไม่สามารถโหลดรายชื่อบริษัทได้")); });
    return () => { cancelled = true; };
  }, [query, statusFilter, page, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  async function activate(c: AdminCompany) {
    setBusyId(c.id);
    setRowError(null);
    try {
      await setCompanyStatus(c.id, "ACTIVE");
      reload();
    } catch (err) {
      setRowError({ id: c.id, message: describeError(err, "เปิดใช้งานไม่สำเร็จ") });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      {/* Import sits above the list (requested) — the list can be pages long. */}
      <ImportPanel onImported={reload} />

      <div className={`${styles.card} ${styles.animateIn} ${styles.delay2}`}>
        <div className={styles.sectionHeadRow}>
          <div>
            <h2 className={styles.sectionHeading}>บริษัท</h2>
            <p className={styles.sectionSub}>{data ? `${data.totalElements} รายการ` : "กำลังโหลด..."}</p>
          </div>
          <form
            style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
            onSubmit={(e) => { e.preventDefault(); setPage(0); setQuery(q.trim()); }}
          >
            <input className={styles.searchInput} placeholder="ค้นหาชื่อบริษัท..." value={q} onChange={(e) => setQ(e.target.value)} />
            <select className={styles.formSelect} style={{ width: "auto" }} value={statusFilter} onChange={(e) => { setPage(0); setStatusFilter(e.target.value); }} aria-label="กรองตามสถานะ">
              <option value="">ทุกสถานะ</option>
              {Object.entries(COMPANY_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button type="submit" className={styles.btnGhost}>ค้นหา</button>
          </form>
        </div>

        {error ? <p className={styles.formError} role="alert">{error}</p> : !data ? (
          <div className={styles.skeletonCard}>
            <div className={styles.skeletonLine} style={{ height: 40 }} />
            <div className={styles.skeletonLine} style={{ height: 40 }} />
          </div>
        ) : data.content.length === 0 ? (
          <p className={styles.emptyState}>ไม่พบบริษัท</p>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr><th>บริษัท</th><th>เลขผู้เสียภาษี</th><th>ประเภท / จังหวัด</th><th>ประกาศ</th><th>สถานะ</th><th>จัดการ</th></tr>
                </thead>
                <tbody>
                  {data.content.map((c) => (
                    <Fragment key={c.id}>
                      <tr>
                        <td>
                          <div className={styles.userName}>{c.nameTh}</div>
                          {c.nameEn && <div className={styles.userEmail}>{c.nameEn}</div>}
                        </td>
                        <td>{c.taxId ?? "—"}</td>
                        <td>
                          <div>{c.industry ?? "—"}</div>
                          <div className={styles.userEmail}>{c.province ?? ""}</div>
                        </td>
                        <td>{c.jobCount ?? 0}</td>
                        <td>
                          <span className={`${styles.badge} ${c.status === "ACTIVE" ? styles.badgeEmployer : c.status === "SUSPENDED" ? styles.badgeRejected : styles.badgePending}`}>
                            {COMPANY_STATUS_LABEL[c.status] ?? c.status}
                          </span>
                        </td>
                        <td className={styles.nowrap}>
                          <div className={styles.rowActions}>
                            <a href={`/companies/${c.id}`} target="_blank" rel="noopener noreferrer" className={styles.btnGhost}>ดูหน้า</a>
                            {c.status === "ACTIVE" ? (
                              <button type="button" className={styles.btnReject} disabled={busyId === c.id} onClick={() => setSuspending(c)}>ระงับ</button>
                            ) : (
                              <button type="button" className={styles.btnApprove} disabled={busyId === c.id} onClick={() => activate(c)}>เปิดใช้งาน</button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {rowError?.id === c.id && (
                        <tr><td colSpan={6} style={{ borderBottom: "none", paddingTop: 0 }}><p className={styles.formError} role="alert">{rowError.message}</p></td></tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={data.page} totalPages={data.totalPages} onPage={setPage} />
          </>
        )}
      </div>

      <ImportHistory reloadKey={reloadKey} />

      {suspending && <SuspendModal company={suspending} onClose={() => setSuspending(null)} onDone={reload} />}
    </>
  );
}

// ---------- Cost per action (§5.13) ----------

const COST_LABEL: Record<string, string> = {
  RESUME_UPLOAD: "อัปโหลดเรซูเม่",
  ASSESSMENT_SUBMIT: "ส่งแบบประเมิน",
  "process-resume": "Python: วิเคราะห์เรซูเม่",
  "judge-skill-matches": "Python: Semantic matching (B2)",
};

// Per-action cost is a fraction of a cent (USD) — show per 1 time (6 decimals)
// and per 1,000 times, as the backend suggested (รอบ 4 ข้อ 3.6).
function formatCost(value: number, currency: string): string {
  return `${(value || 0).toFixed(6)} ${currency}`;
}
function formatCostPer1000(value: number, currency: string): string {
  return `${((value || 0) * 1000).toFixed(2)} ${currency}`;
}

function CostTable({ title, rows, currency }: { title: string; rows: CostRow[]; currency: string }) {
  return (
    <div style={{ position: "relative", zIndex: 1, marginTop: 16 }}>
      <h3 className={styles.sectionHeading} style={{ marginBottom: 8 }}>{title}</h3>
      {rows.length === 0 ? (
        <p className={styles.statSub}>ยังไม่มีข้อมูลในช่วงนี้ (เริ่มนับ token ตั้งแต่ backend deploy รอบ §5.13)</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>รายการ</th><th>model</th><th>จำนวนครั้ง</th><th>LLM calls เฉลี่ย</th>
                <th>input tokens เฉลี่ย</th><th>output tokens เฉลี่ย</th><th>ต้นทุน / ครั้ง</th><th>ต้นทุน / 1,000 ครั้ง</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name}>
                  <td>
                    <div className={styles.userName}>{COST_LABEL[r.name] ?? r.name}</div>
                    <div className={styles.userEmail}>{r.name}</div>
                  </td>
                  <td>{r.model ?? "—"}</td>
                  <td>{r.samples.toLocaleString("th-TH")}</td>
                  <td>{r.avgLlmCalls != null ? r.avgLlmCalls.toFixed(1) : "—"}</td>
                  <td>{Math.round(r.avgInputTokens).toLocaleString("th-TH")}</td>
                  <td>{Math.round(r.avgOutputTokens).toLocaleString("th-TH")}</td>
                  <td className={styles.nowrap}>{formatCost(r.avgCost, currency)}</td>
                  <td className={styles.nowrap}><strong>{formatCostPer1000(r.avgCost, currency)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CostPanel({ from, to }: { from: string; to: string }) {
  const [cost, setCost] = useState<UsageCost | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getUsageCost(from, to)
      .then((c) => { if (!cancelled) { setCost(c); setError(""); } })
      .catch((err: unknown) => { if (!cancelled) setError(describeError(err, "โหลดข้อมูลต้นทุนไม่ได้")); });
    return () => { cancelled = true; };
  }, [from, to]);

  const currency = cost?.pricePer1M?.currency ?? "USD";
  const priceUnset = !!cost && !cost.pricePer1M?.input && !cost.pricePer1M?.output;

  return (
    <div className={`${styles.card} ${styles.animateIn} ${styles.delay2}`}>
      <div className={styles.sectionHeadRow}>
        <div>
          <h2 className={styles.sectionHeading}>ต้นทุนต่อครั้ง (Cost per action)</h2>
          <p className={styles.sectionSub}>
            {cost
              ? `ราคาต่อ 1M tokens — input ${cost.pricePer1M.input} / output ${cost.pricePer1M.output} ${currency}`
              : "ค่าเฉลี่ย token และต้นทุนต่อการใช้งาน 1 ครั้ง"}
          </p>
        </div>
      </div>
      {error ? (
        <p className={styles.formError} role="alert">{error}</p>
      ) : !cost ? (
        <div className={styles.skeletonCard}><div className={styles.skeletonLine} style={{ height: 60 }} /></div>
      ) : (
        <>
          {priceUnset && (
            <p className={styles.formError} role="status">ยังไม่ได้ตั้งราคาต่อ token ที่ backend (app.llm.price.*) — ต้นทุนจะแสดงเป็น 0</p>
          )}
          <CostTable title="ต่อการใช้งานของผู้ใช้" rows={cost.byAction ?? []} currency={currency} />
          <CostTable title="ต่อ endpoint ฝั่ง Python (AI)" rows={cost.byPythonEndpoint ?? []} currency={currency} />
        </>
      )}
    </div>
  );
}

// ---------- Usage (B8) ----------

function monthStartIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function UsageTab() {
  const [from, setFrom] = useState(monthStartIso);
  const [to, setTo] = useState(todayIso);
  const [action, setAction] = useState("");
  const [range, setRange] = useState({ from: monthStartIso(), to: todayIso(), action: "" });
  const [summary, setSummary] = useState<UsageSummaryRow[] | null>(null);
  const [log, setLog] = useState<Paged<UsageLogRow> | null>(null);
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getUsageSummary(range.from, range.to)
      .then((s) => { if (!cancelled) setSummary(s); })
      .catch((err: unknown) => { if (!cancelled) setError(describeError(err, "โหลดสรุปการใช้งานไม่ได้")); });
    return () => { cancelled = true; };
  }, [range]);

  useEffect(() => {
    let cancelled = false;
    listUsage({ from: range.from, to: range.to, action: range.action, page })
      .then((d) => { if (!cancelled) setLog(d); })
      .catch((err: unknown) => { if (!cancelled) setError(describeError(err, "โหลดรายการใช้งานไม่ได้")); });
    return () => { cancelled = true; };
  }, [range, page]);

  return (
    <>
      <div className={`${styles.card} ${styles.animateIn} ${styles.delay2}`}>
        <div className={styles.sectionHeadRow}>
          <div>
            <h2 className={styles.sectionHeading}>สรุปการใช้งาน</h2>
            <p className={styles.sectionSub}>จำนวนครั้ง / เครดิตที่ใช้ในช่วงวันที่เลือก</p>
          </div>
          <form
            style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}
            onSubmit={(e) => { e.preventDefault(); setError(""); setPage(0); setRange({ from, to, action }); }}
          >
            <input type="date" className={styles.formInput} style={{ width: "auto" }} value={from} onChange={(e) => setFrom(e.target.value)} aria-label="ตั้งแต่วันที่" />
            <input type="date" className={styles.formInput} style={{ width: "auto" }} value={to} min={from} onChange={(e) => setTo(e.target.value)} aria-label="ถึงวันที่" />
            <select className={styles.formSelect} style={{ width: "auto" }} value={action} onChange={(e) => setAction(e.target.value)} aria-label="ประเภทการใช้งาน">
              <option value="">ทุกประเภท</option>
              <option value="RESUME_UPLOAD">อัปโหลดเรซูเม่</option>
              <option value="ASSESSMENT_SUBMIT">ส่งแบบประเมิน</option>
            </select>
            <button type="submit" className={styles.btnGhost}>แสดง</button>
          </form>
        </div>
        {error && <p className={styles.formError} role="alert">{error}</p>}
        {summary === null ? (
          <div className={styles.skeletonCard}><div className={styles.skeletonLine} style={{ height: 60 }} /></div>
        ) : (
          summary.length === 0 ? (
            <p className={styles.emptyState}>ไม่มีการใช้งานในช่วงนี้</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr><th>ประเภท</th><th>ทั้งหมด</th><th>สำเร็จ</th><th>ไม่สำเร็จ</th><th>เครดิตที่ใช้</th></tr>
                </thead>
                <tbody>
                  {summary.map((r) => (
                    <tr key={r.action}>
                      <td>
                        <div className={styles.userName}>{ACTION_LABEL[r.action] ?? r.action}</div>
                        <div className={styles.userEmail}>{r.action}</div>
                      </td>
                      <td>{r.total.toLocaleString("th-TH")}</td>
                      <td>{r.success.toLocaleString("th-TH")}</td>
                      <td>{(r.total - r.success).toLocaleString("th-TH")}</td>
                      <td>{r.creditsUsed.toLocaleString("th-TH")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      <CostPanel from={range.from} to={range.to} />

      <div className={`${styles.card} ${styles.animateIn} ${styles.delay3}`}>
        <div className={styles.sectionHeadRow}>
          <h2 className={styles.sectionHeading}>รายการใช้งาน</h2>
          <p className={styles.sectionSub}>{log ? `${log.totalElements} รายการ` : ""}</p>
        </div>
        {!log ? (
          <div className={styles.skeletonCard}><div className={styles.skeletonLine} style={{ height: 40 }} /></div>
        ) : (
          <>
            {log.content.length === 0 ? (
              <p className={styles.emptyState}>ไม่มีรายการ</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr><th>วันเวลา</th><th>ผู้ใช้</th><th>ประเภท</th><th>ผล</th><th>เครดิต</th><th>ใช้เวลา</th><th>รายละเอียด</th></tr>
                  </thead>
                  <tbody>
                    {log.content.map((r) => (
                      <tr key={r.id}>
                        <td className={styles.nowrap}>{formatDateTime(r.createdAt)}</td>
                        <td>{r.email ?? <span className={styles.userEmail}>บัญชีที่ลบแล้ว</span>}</td>
                        <td>{ACTION_LABEL[r.action] ?? r.action}</td>
                        <td>
                          <span className={`${styles.badge} ${r.success ? styles.badgeEmployer : styles.badgeRejected}`}>
                            {r.success ? "สำเร็จ" : "ไม่สำเร็จ"}
                          </span>
                        </td>
                        <td>{r.creditsUsed}</td>
                        <td className={styles.nowrap}>{r.durationMs != null ? `${(r.durationMs / 1000).toFixed(1)} วิ` : "—"}</td>
                        <td>{r.detail ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pager page={log.page} totalPages={log.totalPages} onPage={setPage} />
          </>
        )}
      </div>
    </>
  );
}

// ---------- Internships (B6) ----------

export function InternshipsTab() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Paged<Internship> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    listAllInternships({ status: statusFilter, page })
      .then((d) => { if (!cancelled) { setData(d); setError(""); } })
      .catch((err: unknown) => { if (!cancelled) setError(describeError(err, "โหลดประวัติฝึกงานไม่ได้")); });
    return () => { cancelled = true; };
  }, [statusFilter, page]);

  return (
    <div className={`${styles.card} ${styles.animateIn} ${styles.delay2}`}>
      <div className={styles.sectionHeadRow}>
        <div>
          <h2 className={styles.sectionHeading}>ประวัติฝึกงานทั้งระบบ</h2>
          <p className={styles.sectionSub}>{data ? `${data.totalElements} รายการ` : "กำลังโหลด..."}</p>
        </div>
        <select className={styles.formSelect} style={{ width: "auto", minWidth: 160 }} value={statusFilter} onChange={(e) => { setPage(0); setStatusFilter(e.target.value); }} aria-label="กรองตามสถานะ">
          <option value="">ทุกสถานะ</option>
          {INTERNSHIP_STATUSES.map((s) => <option key={s} value={s}>{INTERNSHIP_STATUS_LABEL[s]}</option>)}
        </select>
      </div>
      {error ? <p className={styles.formError} role="alert">{error}</p> : !data ? (
        <div className={styles.skeletonCard}><div className={styles.skeletonLine} style={{ height: 40 }} /></div>
      ) : data.content.length === 0 ? (
        <p className={styles.emptyState}>ไม่มีรายการ</p>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>นักศึกษา</th><th>บริษัท / ตำแหน่ง</th><th>ช่วงเวลา</th><th>สถานะ</th></tr>
              </thead>
              <tbody>
                {data.content.map((i) => (
                  <tr key={i.id}>
                    <td className={styles.userName}>{i.studentName}</td>
                    <td>
                      <div>{i.companyName}{!i.companyId && <span className={styles.userEmail}> · นอกระบบ</span>}</div>
                      <div className={styles.userEmail}>{i.positionName ?? "-"}</div>
                    </td>
                    <td className={styles.nowrap}>{formatThaiDateRange(i.startDate, i.endDate)}</td>
                    <td><InternshipStatusBadge status={i.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={data.page} totalPages={data.totalPages} onPage={setPage} />
        </>
      )}
    </div>
  );
}
