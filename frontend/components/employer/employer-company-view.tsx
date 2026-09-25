"use client";

// EMPLOYER — edit own company profile (GET/PUT /companies/me, API_CHANGES.md
// §5.4). Only changed fields are sent. Styling reuses admin-dashboard.module.css
// like the rest of /employer/jobs.

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { describeError, getErrorCode } from "@/lib/api-client";
import { CONTACT_EMAIL } from "@/components/legal/privacy-policy-content";
import { getMyCompany, updateMyCompany, type Company, type CompanyInput } from "@/lib/company-service";
import styles from "@/components/admin/admin-dashboard.module.css";

type Status = "loading" | "error" | "success";

const EMPTY: CompanyInput = {
  nameTh: "",
  nameEn: "",
  industry: "",
  description: "",
  website: "",
  email: "",
  phone: "",
  address: "",
  province: "",
  logoUrl: "",
};

const FIELDS: { key: keyof CompanyInput; label: string; placeholder: string; type?: string; wide?: boolean; multiline?: boolean }[] = [
  { key: "nameTh", label: "ชื่อบริษัท (ไทย)", placeholder: "บริษัท ตัวอย่าง จำกัด" },
  { key: "nameEn", label: "ชื่อบริษัท (อังกฤษ)", placeholder: "Example Co., Ltd." },
  { key: "industry", label: "ประเภทธุรกิจ", placeholder: "เช่น Software" },
  { key: "province", label: "จังหวัด", placeholder: "เช่น ขอนแก่น" },
  { key: "description", label: "เกี่ยวกับบริษัท", placeholder: "อธิบายธุรกิจ วัฒนธรรมองค์กร และสิ่งที่นักศึกษาฝึกงานจะได้เรียนรู้", wide: true, multiline: true },
  { key: "address", label: "ที่อยู่", placeholder: "123 ถ.มิตรภาพ", wide: true },
  { key: "website", label: "เว็บไซต์", placeholder: "https://example.co.th", type: "url" },
  { key: "logoUrl", label: "ลิงก์รูปโลโก้", placeholder: "https://.../logo.png", type: "url" },
  { key: "email", label: "อีเมลติดต่อ", placeholder: "hr@example.co.th", type: "email" },
  { key: "phone", label: "โทรศัพท์", placeholder: "02-123-4567", type: "tel" },
];

function toForm(c: Company): CompanyInput {
  return {
    nameTh: c.nameTh ?? "",
    nameEn: c.nameEn ?? "",
    industry: c.industry ?? "",
    description: c.description ?? "",
    website: c.website ?? "",
    email: c.email ?? "",
    phone: c.phone ?? "",
    address: c.address ?? "",
    province: c.province ?? "",
    logoUrl: c.logoUrl ?? "",
  };
}

function validate(form: CompanyInput): string | null {
  if (!form.nameTh.trim()) return "กรุณากรอกชื่อบริษัท (ไทย)";
  for (const key of ["website", "logoUrl"] as const) {
    const v = form[key].trim();
    if (v && !/^https?:\/\/\S+$/i.test(v)) return "ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https://";
  }
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "รูปแบบอีเมลไม่ถูกต้อง";
  return null;
}

export function EmployerCompanyView() {
  const [status, setStatus] = useState<Status>("loading");
  const [company, setCompany] = useState<Company | null>(null);
  const [form, setForm] = useState<CompanyInput>(EMPTY);
  const [loadError, setLoadError] = useState("");
  const [noCompany, setNoCompany] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getMyCompany()
      .then((c) => {
        if (cancelled) return;
        setCompany(c);
        setForm(toForm(c));
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // 404 NO_COMPANY = this employer account isn't linked to a company yet.
        setNoCompany(getErrorCode(err) === "NO_COMPANY");
        setLoadError(describeError(err, "ไม่สามารถโหลดข้อมูลบริษัทได้"));
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const changed = useMemo(() => {
    if (!company) return {} as Partial<CompanyInput>;
    const original = toForm(company);
    const diff: Partial<CompanyInput> = {};
    (Object.keys(form) as (keyof CompanyInput)[]).forEach((k) => {
      if (form[k].trim() !== original[k].trim()) diff[k] = form[k].trim();
    });
    return diff;
  }, [company, form]);
  const hasChanges = Object.keys(changed).length > 0;

  async function handleSave() {
    const problem = validate(form);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const updated = await updateMyCompany(changed);
      // Some backends return the entity, some just OK — fall back to local merge.
      const next = updated && typeof updated === "object" && "id" in updated ? updated : { ...company!, ...changed };
      setCompany(next as Company);
      setForm(toForm(next as Company));
      setSaved(true);
    } catch (err) {
      setError(describeError(err, "บันทึกข้อมูลบริษัทไม่สำเร็จ กรุณาลองใหม่"));
    } finally {
      setSaving(false);
    }
  }

  if (status === "error" && noCompany) {
    return (
      <div className={`${styles.card} ${styles.animateIn} ${styles.delay2}`}>
        <h2 className={styles.sectionHeading}>บัญชีนี้ยังไม่ได้ผูกกับบริษัท</h2>
        <p className={styles.sectionSub} style={{ marginTop: 8, lineHeight: 1.7 }}>
          ระบบยังไม่มีบริษัทที่เชื่อมกับบัญชีผู้ประกาศงานนี้ จึงยังแก้ข้อมูลบริษัทและลงประกาศงานไม่ได้
          กรุณาติดต่อผู้ดูแลระบบ
          {CONTACT_EMAIL ? (
            <>
              {" "}ที่ <a href={`mailto:${CONTACT_EMAIL}`} style={{ textDecoration: "underline" }}>{CONTACT_EMAIL}</a>
            </>
          ) : null}{" "}
          พร้อมแจ้งชื่อบริษัทและเลขประจำตัวผู้เสียภาษี
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={`${styles.card} ${styles.animateIn} ${styles.delay2}`}>
        <p className={styles.formError} role="alert">{loadError}</p>
        <button
          type="button"
          className={styles.refreshBtn}
          style={{ marginTop: 12 }}
          onClick={() => {
            setStatus("loading");
            setReloadKey((k) => k + 1);
          }}
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${styles.animateIn} ${styles.delay2}`}>
      <div className={styles.sectionHeadRow}>
        <div>
          <h2 className={styles.sectionHeading}>ข้อมูลบริษัท</h2>
          <p className={styles.sectionSub}>ข้อมูลนี้แสดงในหน้าโปรไฟล์บริษัทที่นักศึกษาเห็น</p>
        </div>
        {company && (
          <Link href={`/companies/${company.id}`} className={styles.btnGhost} target="_blank" rel="noopener noreferrer">
            ดูหน้าบริษัท
          </Link>
        )}
      </div>

      {status === "loading" ? (
        <div className={styles.skeletonCard}>
          <div className={styles.skeletonLine} style={{ height: 40 }} />
          <div className={styles.skeletonLine} style={{ height: 40 }} />
          <div className={styles.skeletonLine} style={{ height: 80 }} />
        </div>
      ) : (
        <form
          style={{ position: "relative", zIndex: 1 }}
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
        >
          {company?.status && company.status !== "ACTIVE" && (
            <p className={styles.formError} role="status" style={{ marginBottom: 14 }}>
              สถานะบริษัท: {company.status} — หน้าบริษัทจะยังไม่แสดงต่อสาธารณะจนกว่าผู้ดูแลระบบจะเปิดใช้งาน
            </p>
          )}
          <div className={styles.grid2}>
            {FIELDS.map((f) => (
              <div key={f.key} className={styles.formField} style={f.wide ? { gridColumn: "1 / -1" } : undefined}>
                <label className={styles.formLabel} htmlFor={`co-${f.key}`}>{f.label}</label>
                {f.multiline ? (
                  <textarea
                    id={`co-${f.key}`}
                    className={styles.formTextarea}
                    value={form[f.key]}
                    placeholder={f.placeholder}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  />
                ) : (
                  <input
                    id={`co-${f.key}`}
                    type={f.type ?? "text"}
                    className={styles.formInput}
                    value={form[f.key]}
                    placeholder={f.placeholder}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>

          {error && <p className={styles.formError} role="alert">{error}</p>}
          {saved && !hasChanges && (
            <p className={styles.statSub} role="status" style={{ color: "var(--nocturne-success-text)" }}>
              บันทึกข้อมูลบริษัทแล้ว
            </p>
          )}

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.btnGhost}
              disabled={!hasChanges || saving}
              onClick={() => company && setForm(toForm(company))}
            >
              ยกเลิกการแก้ไข
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={!hasChanges || saving}>
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
