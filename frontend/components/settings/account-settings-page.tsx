"use client";

// /settings — account info, credits, and PDPA rights (API_CHANGES.md §5.8–5.9):
// consent history + withdraw, download my data (JSON), delete account.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { describeError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useCredits } from "@/lib/credit-service";
import {
  deleteMyAccount,
  downloadMyData,
  listMyConsents,
  withdrawConsent,
  type ConsentRecord,
} from "@/lib/account-service";
import { formatThaiDate } from "@/lib/date-format";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import styles from "@/components/admin/admin-dashboard.module.css";

const ROLE_LABEL: Record<string, string> = { STUDENT: "นักศึกษา", EMPLOYER: "ผู้ประกาศงาน", ADMIN: "ผู้ดูแลระบบ" };

function DeleteAccountModal({ email, isGoogle, onClose, onDeleted }: { email: string; isGoogle: boolean | null; onClose: () => void; onDeleted: () => void }) {
  // isGoogle === null → provider unknown: default to password, allow switching.
  const [useEmailConfirm, setUseEmailConfirm] = useState(isGoogle === true);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!value.trim()) {
      setError(useEmailConfirm ? "กรุณาพิมพ์อีเมลของคุณ" : "กรุณากรอกรหัสผ่าน");
      return;
    }
    if (useEmailConfirm && value.trim().toLowerCase() !== email.toLowerCase()) {
      setError("อีเมลไม่ตรงกับบัญชีนี้");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await deleteMyAccount(useEmailConfirm ? { confirm: value.trim() } : { password: value });
      onDeleted();
    } catch (err) {
      setError(describeError(err, "ลบบัญชีไม่สำเร็จ"));
      setBusy(false);
    }
  }

  return createPortal(
    <div className={styles.modalOverlay} onClick={busy ? undefined : onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>ลบบัญชีถาวร</h3>
        <p className={styles.formError} role="alert" style={{ marginBottom: 14 }}>
          ข้อมูลบัญชี เรซูเม่ ผลประเมิน และประวัติทั้งหมดจะถูกลบและกู้คืนไม่ได้ แนะนำให้ดาวน์โหลดข้อมูลของคุณเก็บไว้ก่อน
        </p>
        {error && <p className={styles.formError} role="alert" style={{ marginBottom: 12 }}>{error}</p>}
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="del-confirm">
              {useEmailConfirm ? `พิมพ์อีเมล ${email} เพื่อยืนยัน` : "กรอกรหัสผ่านเพื่อยืนยัน"}
            </label>
            <input
              id="del-confirm"
              type={useEmailConfirm ? "email" : "password"}
              autoComplete={useEmailConfirm ? "off" : "current-password"}
              className={styles.formInput}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          {isGoogle !== true && (
            <button
              type="button"
              className={styles.btnGhost}
              style={{ padding: 0, border: "none" }}
              onClick={() => { setUseEmailConfirm((v) => !v); setValue(""); setError(""); }}
            >
              {useEmailConfirm ? "ใช้รหัสผ่านแทน" : "สมัครด้วย Google? ยืนยันด้วยอีเมลแทน"}
            </button>
          )}
          <div className={styles.modalActions}>
            <button type="button" className={styles.btnGhost} onClick={onClose} disabled={busy}>ยกเลิก</button>
            <button type="submit" className={styles.btnDanger} disabled={busy}>{busy ? "กำลังลบ..." : "ลบบัญชีถาวร"}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export function AccountSettingsPage() {
  const router = useRouter();
  const { user, setSession, clearSession } = useAuth();
  const { credits } = useCredits(!!user);
  const [consents, setConsents] = useState<ConsentRecord[] | null>(null);
  const [consentError, setConsentError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState<"export" | "withdraw" | null>(null);
  const [actionError, setActionError] = useState("");
  const [exported, setExported] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    listMyConsents()
      .then((list) => { if (!cancelled) { setConsents(list); setConsentError(""); } })
      .catch((err: unknown) => { if (!cancelled) setConsentError(describeError(err, "โหลดประวัติการยอมรับนโยบายไม่ได้")); });
    return () => { cancelled = true; };
  }, [user, reloadKey]);

  if (!user) return null;

  const provider = user.authProvider?.toUpperCase();
  const isGoogle = provider ? provider === "GOOGLE" : null;

  async function handleExport() {
    setBusy("export");
    setActionError("");
    setExported(false);
    try {
      await downloadMyData();
      setExported(true);
    } catch (err) {
      setActionError(describeError(err, "ดาวน์โหลดข้อมูลไม่สำเร็จ"));
    } finally {
      setBusy(null);
    }
  }

  async function handleWithdraw() {
    if (!user) return;
    if (!window.confirm("ถอนความยินยอมตามนโยบายความเป็นส่วนตัว?\nระบบจะขอให้คุณยอมรับนโยบายอีกครั้งก่อนใช้งานต่อ")) return;
    setBusy("withdraw");
    setActionError("");
    try {
      await withdrawConsent();
      // Mirrors /auth/me → needsConsent: true, which brings up ConsentModal.
      setSession({ ...user, needsConsent: true, accessToken: null });
      setReloadKey((k) => k + 1);
    } catch (err) {
      setActionError(describeError(err, "ถอนความยินยอมไม่สำเร็จ"));
    } finally {
      setBusy(null);
    }
  }

  async function handleDeleted() {
    // Backend already cleared the cookie; clearSession resets local state (logout call may 401 — ignored).
    await clearSession();
    router.replace("/");
  }

  const creditLine =
    credits === null
      ? "—"
      : credits.unlimited
        ? "ไม่จำกัด"
        : `${credits.remaining ?? 0} / ${credits.monthlyLimit ?? 0} ครั้ง${credits.resetAt ? ` · รีเซ็ต ${formatThaiDate(credits.resetAt)}` : ""}`;

  return (
    <DashboardShell eyebrow="RESUMATE — บัญชี" heading="ตั้งค่าบัญชี" subheading="ข้อมูลบัญชี เครดิต และสิทธิ์ของคุณตามนโยบายความเป็นส่วนตัว (PDPA)">
      <div className={`${styles.card} ${styles.animateIn} ${styles.delay2}`}>
        <div className={styles.sectionHeadRow}>
          <h2 className={styles.sectionHeading}>ข้อมูลบัญชี</h2>
        </div>
        <div className={styles.grid2} style={{ position: "relative", zIndex: 1 }}>
          <div><div className={styles.userEmail}>ชื่อ</div><div className={styles.userName}>{user.fullname || "—"}</div></div>
          <div><div className={styles.userEmail}>อีเมล</div><div className={styles.userName}>{user.email}</div></div>
          <div><div className={styles.userEmail}>ประเภทบัญชี</div><div className={styles.userName}>{ROLE_LABEL[user.role] ?? user.role}{isGoogle ? " · Google" : ""}</div></div>
          <div><div className={styles.userEmail}>เครดิตเดือนนี้</div><div className={styles.userName}>{creditLine}</div></div>
        </div>
      </div>

      <div className={`${styles.card} ${styles.animateIn} ${styles.delay3}`}>
        <div className={styles.sectionHeadRow}>
          <div>
            <h2 className={styles.sectionHeading}>ความเป็นส่วนตัว</h2>
            <p className={styles.sectionSub}>
              อ่าน <Link href="/privacy-policy" target="_blank" style={{ textDecoration: "underline" }}>นโยบายความเป็นส่วนตัว</Link>
            </p>
          </div>
        </div>
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          {actionError && <p className={styles.formError} role="alert">{actionError}</p>}

          <div>
            <h3 className={styles.formLabel} style={{ margin: "0 0 8px" }}>ประวัติการยอมรับนโยบาย</h3>
            {consentError ? (
              <p className={styles.formError} role="alert">{consentError}</p>
            ) : consents === null ? (
              <div className={styles.skeletonLine} style={{ height: 32 }} />
            ) : consents.length === 0 ? (
              <p className={styles.statSub}>ยังไม่มีประวัติการยอมรับ</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>เวอร์ชัน</th><th>ยอมรับเมื่อ</th><th>ถอนเมื่อ</th></tr></thead>
                  <tbody>
                    {consents.map((c, i) => (
                      <tr key={c.id ?? i}>
                        <td>{c.version}</td>
                        <td>{formatThaiDate(c.acceptedAt ?? null) || "—"}</td>
                        <td>{formatThaiDate(c.withdrawnAt ?? null) || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button type="button" className={styles.refreshBtn} onClick={handleExport} disabled={busy !== null}>
              {busy === "export" ? "กำลังเตรียมไฟล์..." : "ดาวน์โหลดข้อมูลของฉัน (JSON)"}
            </button>
            <button type="button" className={styles.btnGhost} onClick={handleWithdraw} disabled={busy !== null || user.needsConsent === true}>
              {busy === "withdraw" ? "กำลังถอน..." : "ถอนความยินยอม"}
            </button>
            {exported && <span className={styles.statSub} role="status" style={{ color: "var(--nocturne-success-text)" }}>ดาวน์โหลดแล้ว</span>}
          </div>
        </div>
      </div>

      <div className={`${styles.card} ${styles.animateIn} ${styles.delay4}`}>
        <div className={styles.sectionHeadRow}>
          <div>
            <h2 className={styles.sectionHeading}>ลบบัญชี</h2>
            <p className={styles.sectionSub}>ลบบัญชีและข้อมูลที่เกี่ยวข้องทั้งหมดอย่างถาวร</p>
          </div>
          <button type="button" className={styles.btnDanger} onClick={() => setDeleting(true)}>ลบบัญชี</button>
        </div>
      </div>

      {deleting && (
        <DeleteAccountModal email={user.email} isGoogle={isGoogle} onClose={() => setDeleting(false)} onDeleted={handleDeleted} />
      )}
    </DashboardShell>
  );
}
