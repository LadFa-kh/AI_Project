"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, type FormEvent } from "react";
import { register, loginWithGoogle } from "@/lib/auth-service";
import { ApiError, NetworkError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useGoogleSignIn } from "@/lib/use-google-signin";
import styles from "./register.module.css";

type FieldErrors = {
  name?: string | null;
  email?: string | null;
  password?: string | null;
  confirmPassword?: string | null;
  terms?: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateName(value: string): string | null {
  if (!value.trim()) return "กรุณากรอกชื่อ-นามสกุลของคุณ";
  return null;
}

function validateEmail(value: string): string | null {
  if (!value.trim()) return "กรุณากรอกอีเมลของคุณ";
  if (!EMAIL_RE.test(value)) return "กรุณากรอกอีเมลให้ถูกต้อง";
  return null;
}

function validatePassword(value: string): string | null {
  if (!value) return "กรุณากรอกรหัสผ่าน";
  if (value.length < 8) return "ใช้อย่างน้อย 8 ตัวอักษร";
  return null;
}

function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) return "กรุณายืนยันรหัสผ่านของคุณ";
  if (confirm !== password) return "รหัสผ่านไม่ตรงกัน";
  return null;
}

function getPasswordStrength(value: string): { score: number; label: string; color: string } {
  if (!value) return { score: 0, label: "", color: "transparent" };
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;

  if (score <= 1) return { score: 1, label: "อ่อน", color: "oklch(70% 0.15 25)" };
  if (score <= 3) return { score: 2, label: "พอใช้", color: "oklch(78% 0.14 85)" };
  return { score: 3, label: "แข็งแรง", color: "oklch(75% 0.14 150)" };
}

export function RegisterForm() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"default" | "loading" | "error">("default");
  const [formError, setFormError] = useState<string | null>(null);

  const isLoading = status === "loading";
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  function validate(): boolean {
    const nextErrors: FieldErrors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
      terms: agreedToTerms ? null : "คุณต้องยอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว",
    };
    setErrors(nextErrors);
    return Object.values(nextErrors).every((err) => !err);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (!validate()) return;

    setStatus("loading");
    try {
      // Backend field is `fullname` (not `name`); `role` defaults server-side to STUDENT.
      const session = await register(email, password, name);
      await setSession(session);
      setStatus("default");
      router.push("/");
    } catch (err) {
      setStatus("error");
      setFormError(
        err instanceof ApiError || err instanceof NetworkError
          ? err.message
          : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
      );
    }
  }

  const handleGoogleIdToken = useCallback(
    async (idToken: string) => {
      setFormError(null);
      setStatus("loading");
      try {
        const session = await loginWithGoogle(idToken);
        await setSession(session);
        setStatus("default");
        router.push("/");
      } catch (err) {
        setStatus("error");
        setFormError(
          err instanceof ApiError || err instanceof NetworkError
            ? err.message
            : "สมัครสมาชิกด้วย Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
        );
      }
    },
    [router, setSession]
  );

  const { containerRef: googleContainerRef, error: googleError, isReady: googleReady } =
    useGoogleSignIn(handleGoogleIdToken);

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {(formError || googleError) && (
        <p className={`${styles.formError} ${styles.animateIn}`} role="alert">
          <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V72a8,8,0,0,1,16,0v64a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z" />
          </svg>
          {formError || googleError}
        </p>
      )}

      <div className={`${styles.field} ${styles.animateIn} ${styles.delay3}`}>
        <label htmlFor="name">ชื่อ-นามสกุล</label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          placeholder="สมชาย ใจดี"
          className={`${styles.input} ${errors.name ? styles.inputInvalid : ""}`}
        />
        {errors.name && <p id="name-error" className={styles.fieldError}>{errors.name}</p>}
      </div>

      <div className={`${styles.field} ${styles.animateIn} ${styles.delay3}`}>
        <label htmlFor="email">อีเมล</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          placeholder="you@university.edu"
          className={`${styles.input} ${errors.email ? styles.inputInvalid : ""}`}
        />
        {errors.email && <p id="email-error" className={styles.fieldError}>{errors.email}</p>}
      </div>

      <div className={`${styles.field} ${styles.animateIn} ${styles.delay3}`}>
        <label htmlFor="password">รหัสผ่าน</label>
        <div className={styles.inputWrap}>
        <input
          id="password"
          name="password"
            type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : "password-strength"}
          placeholder="อย่างน้อย 8 ตัวอักษร"
          className={`${styles.input} ${errors.password ? styles.inputInvalid : ""}`}
        />
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={() => setShowPassword((v) => !v)}
            disabled={isLoading}
            aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            aria-pressed={showPassword}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 3l18 18M10.58 10.58a2 2 0 0 0 2.83 2.83M9.36 5.36A9.77 9.77 0 0 1 12 5c5 0 9 4 10 7-.32.98-1 2.14-1.99 3.24M6.6 6.6C4.5 8.02 2.9 10 2 12c1 3 5 7 10 7 1.28 0 2.5-.26 3.6-.72" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            )}
          </button>
        </div>
        {errors.password ? (
          <p id="password-error" className={styles.fieldError}>{errors.password}</p>
        ) : (
          password && (
            <div id="password-strength" className={styles.strengthRow}>
              <div className={styles.strengthBar}>
                <div
                  className={styles.strengthFill}
                  style={{ width: `${(strength.score / 3) * 100}%`, background: strength.color }}
                />
              </div>
              <span className={styles.strengthLabel} style={{ color: strength.color }}>{strength.label}</span>
            </div>
          )
        )}
      </div>

      <div className={`${styles.field} ${styles.animateIn} ${styles.delay3}`}>
        <label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</label>
        <div className={styles.inputWrap}>
        <input
          id="confirmPassword"
          name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
          placeholder="กรอกรหัสผ่านอีกครั้ง"
          className={`${styles.input} ${errors.confirmPassword ? styles.inputInvalid : ""}`}
        />
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={() => setShowConfirmPassword((v) => !v)}
            disabled={isLoading}
            aria-label={showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            aria-pressed={showConfirmPassword}
            tabIndex={-1}
          >
            {showConfirmPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 3l18 18M10.58 10.58a2 2 0 0 0 2.83 2.83M9.36 5.36A9.77 9.77 0 0 1 12 5c5 0 9 4 10 7-.32.98-1 2.14-1.99 3.24M6.6 6.6C4.5 8.02 2.9 10 2 12c1 3 5 7 10 7 1.28 0 2.5-.26 3.6-.72" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p id="confirm-password-error" className={styles.fieldError}>{errors.confirmPassword}</p>
        )}
      </div>

      <div className={`${styles.checkRow} ${styles.animateIn} ${styles.delay4}`}>
        <input
          id="terms"
          name="terms"
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          disabled={isLoading}
          aria-invalid={!!errors.terms}
          aria-describedby={errors.terms ? "terms-error" : undefined}
          className={styles.checkbox}
        />
        <label htmlFor="terms" className={styles.checkLabel}>
          ฉันยอมรับ <a href="/terms" className={styles.link} style={{ display: "inline", minHeight: "auto" }}>ข้อกำหนดการใช้งาน</a> และ{" "}
          <a href="/privacy" className={styles.link} style={{ display: "inline", minHeight: "auto" }}>นโยบายความเป็นส่วนตัว</a>
        </label>
      </div>
      {errors.terms && <p id="terms-error" className={styles.fieldError} style={{ marginTop: "-8px" }}>{errors.terms}</p>}

      <button
        type="submit"
        className={`${styles.submitBtn} ${styles.animateIn} ${styles.delay4}`}
        disabled={isLoading}
      >
        {isLoading && <span className={styles.spinner} aria-hidden="true" />}
        {isLoading ? "กำลังสร้างบัญชี…" : "สร้างบัญชี"}
      </button>

      <div className={`${styles.divider} ${styles.animateIn} ${styles.delay4}`}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>หรือ</span>
        <span className={styles.dividerLine} />
      </div>

      {/* ปุ่มนี้ถูกเรนเดอร์โดย Google Identity Services เอง — ดูเหตุผลใน lib/use-google-signin.ts */}
      <div className={`${styles.animateIn} ${styles.delay4}`}>
        <div ref={googleContainerRef} style={{ display: googleReady ? "flex" : "none", justifyContent: "center", width: "100%" }} />
        {!googleReady && (
          <div className={styles.googleBtn} aria-busy="true" style={{ pointerEvents: "none", opacity: 0.6 }}>
            กำลังโหลด Google Sign-In…
          </div>
        )}
      </div>
    </form>
  );
}
