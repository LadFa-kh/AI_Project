"use client";

// PDPA consent gate (API_CHANGES.md §5.9). When login or GET /auth/me
// returns needsConsent: true — the user never accepted, withdrew consent,
// or the policy got a new version — block the app with this modal until
// they accept (POST /users/me/consents { version }) or log out.
//
// Rendered via a portal onto <body> so no ancestor transform/filter can
// trap its position:fixed overlay (same reason as the admin modals).

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { acceptPolicy, getCurrentPolicy, type PolicyInfo } from "@/lib/auth-service";
import { describeError } from "@/lib/api-client";
import { LegalDialog } from "@/components/legal/legal-dialog";
import styles from "./consent-modal.module.css";

const FALLBACK_POLICY: Pick<PolicyInfo, "version" | "url"> = { version: "1.0", url: "/privacy-policy" };

export function ConsentModal() {
  const router = useRouter();
  const { user, markConsented, clearSession } = useAuth();
  const open = !!user?.needsConsent;

  const [policy, setPolicy] = useState<Pick<PolicyInfo, "version" | "url" | "effectiveDate"> | null>(null);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFull, setShowFull] = useState(false);
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getCurrentPolicy()
      .then((p) => {
        if (!cancelled) setPolicy(p);
      })
      .catch(() => {
        if (!cancelled) setPolicy({ ...FALLBACK_POLICY, effectiveDate: "" });
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Lock page scroll + move focus into the dialog while it's open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    checkboxRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // `open` is false during SSR/first paint (user is null until /auth/me
  // resolves), so createPortal below only ever runs in the browser.
  if (!open) return null;

  const version = policy?.version ?? FALLBACK_POLICY.version;

  async function handleAccept() {
    if (!checked) return;
    setSaving(true);
    setError(null);
    try {
      await acceptPolicy(version);
      setChecked(false);
      markConsented();
    } catch (err) {
      setError(describeError(err, "บันทึกการยอมรับไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"));
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await clearSession();
    router.push("/login");
  }

  return createPortal(
    <div className={styles.overlay}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        aria-describedby="consent-desc"
      >
        <span className={styles.eyebrow}>PDPA</span>
        <h2 id="consent-title" className={styles.title}>นโยบายความเป็นส่วนตัว</h2>
        <p id="consent-desc" className={styles.text}>
          ระบบใช้ข้อมูลในเรซูเม่และผลแบบประเมินของคุณเพื่อวิเคราะห์ทักษะและแนะนำสถานประกอบการเท่านั้น
          กรุณาอ่านและยอมรับนโยบายความเป็นส่วนตัวก่อนใช้งานต่อ
        </p>

        <ul className={styles.points}>
          <li>ข้อมูลที่เก็บ: ข้อมูลบัญชี ไฟล์เรซูเม่ ทักษะที่สกัดได้ และคำตอบแบบประเมิน</li>
          <li>ข้อมูลเรซูเม่ถูกส่งให้ AI วิเคราะห์เพื่อคำนวณคะแนนและคำแนะนำ</li>
          <li>คุณขอดาวน์โหลดข้อมูล ถอนความยินยอม หรือลบบัญชีได้ตลอดเวลา</li>
        </ul>

        <p className={styles.meta}>
          เวอร์ชัน {version}
          {policy?.effectiveDate ? ` · มีผลตั้งแต่ ${new Date(policy.effectiveDate).toLocaleDateString("th-TH")}` : ""}
          {" · "}
          <button
            type="button"
            className={styles.link}
            style={{ padding: 0, background: "none", border: "none", cursor: "pointer", font: "inherit" }}
            onClick={() => setShowFull(true)}
          >
            อ่านนโยบายฉบับเต็ม
          </button>
        </p>

        <label className={styles.checkRow}>
          <input
            ref={checkboxRef}
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            disabled={saving}
            className={styles.checkbox}
          />
          <span>ฉันได้อ่านและยอมรับนโยบายความเป็นส่วนตัว</span>
        </label>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.btnGhost} onClick={handleLogout} disabled={saving}>
            ออกจากระบบ
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleAccept}
            disabled={!checked || saving}
          >
            {saving ? "กำลังบันทึก..." : "ยอมรับและใช้งานต่อ"}
          </button>
        </div>
      </div>
      {showFull && (
        <LegalDialog
          doc="privacy"
          onClose={() => setShowFull(false)}
          acceptLabel="อ่านแล้ว ยอมรับนโยบาย"
          onAccept={() => {
            setChecked(true);
            setShowFull(false);
          }}
        />
      )}
    </div>,
    document.body
  );
}
