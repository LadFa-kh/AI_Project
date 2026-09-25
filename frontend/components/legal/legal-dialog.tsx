"use client";

// Shows the terms of use / privacy policy in a dialog instead of sending the
// user to another tab — used by the register form (so a half-filled form isn't
// lost) and by ConsentModal. Optional onAccept renders an "ยอมรับ" button.

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  PRIVACY_POLICY_EFFECTIVE_DATE_LABEL,
  PRIVACY_POLICY_VERSION,
  PrivacyPolicyContent,
} from "./privacy-policy-content";
import { TERMS_EFFECTIVE_DATE_LABEL, TERMS_VERSION, TermsContent } from "./terms-content";
import styles from "./legal-dialog.module.css";

export type LegalDoc = "terms" | "privacy";

const DOCS: Record<LegalDoc, { title: string; meta: string; href: string }> = {
  terms: {
    title: "ข้อกำหนดการใช้งาน",
    meta: `เวอร์ชัน ${TERMS_VERSION} · มีผลตั้งแต่ ${TERMS_EFFECTIVE_DATE_LABEL}`,
    href: "/terms",
  },
  privacy: {
    title: "นโยบายความเป็นส่วนตัว",
    meta: `เวอร์ชัน ${PRIVACY_POLICY_VERSION} · มีผลตั้งแต่ ${PRIVACY_POLICY_EFFECTIVE_DATE_LABEL}`,
    href: "/privacy-policy",
  },
};

export function LegalDialog({
  doc,
  onClose,
  onAccept,
  acceptLabel = "ยอมรับ",
}: {
  doc: LegalDoc;
  onClose: () => void;
  onAccept?: () => void;
  acceptLabel?: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const info = DOCS[doc];

  useEffect(() => {
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.head}>
          <div>
            <h2 id="legal-dialog-title" className={styles.title}>{info.title}</h2>
            <p className={styles.meta}>{info.meta}</p>
          </div>
          <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="ปิด">
            ×
          </button>
        </div>
        <div className={styles.body}>{doc === "terms" ? <TermsContent /> : <PrivacyPolicyContent />}</div>
        <div className={styles.foot}>
          <a href={info.href} target="_blank" rel="noopener noreferrer" className={styles.hint}>
            เปิดในแท็บใหม่ ↗
          </a>
          <div className={styles.actions}>
            <button type="button" className={styles.btnGhost} onClick={onClose}>
              ปิด
            </button>
            {onAccept && (
              <button type="button" className={styles.btnPrimary} onClick={onAccept}>
                {acceptLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
