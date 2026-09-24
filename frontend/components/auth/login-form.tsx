"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";
import { login, loginWithGoogle } from "@/lib/auth-service";
import { describeError, getErrorCode } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useGoogleSignIn } from "@/lib/use-google-signin";
import { EmployerPendingNotice } from "./employer-pending-notice";
import styles from "./login.module.css";

type FieldErrors = {
  email?: string | null;
  password?: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(value: string): string | null {
  if (!value.trim()) return "กรุณากรอกอีเมลของคุณ";
  if (!EMAIL_RE.test(value)) return "กรุณากรอกอีเมลให้ถูกต้อง";
  return null;
}

function validatePassword(value: string): string | null {
  if (!value) return "กรุณากรอกรหัสผ่านของคุณ";
  return null;
}

export function LoginForm() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"default" | "loading" | "error">("default");
  const [formError, setFormError] = useState<string | null>(null);
  // Employer account still awaiting admin approval (403 EMPLOYER_PENDING).
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const isLoading = status === "loading";

  function validate(): boolean {
    const nextErrors: FieldErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
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
      const session = await login(email, password);
      await setSession(session);
      setStatus("default");
      router.push("/");
    } catch (err) {
      setStatus("error");
      if (getErrorCode(err) === "EMPLOYER_PENDING") {
        setPendingMessage(describeError(err, ""));
        return;
      }
      // EMPLOYER_REJECTED / ACCOUNT_SUSPENDED: backend message explains why.
      setFormError(describeError(err, "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"));
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
        if (getErrorCode(err) === "EMPLOYER_PENDING") {
          setPendingMessage(describeError(err, ""));
          return;
        }
        setFormError(describeError(err, "เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"));
      }
    },
    [router, setSession]
  );

  const { containerRef: googleContainerRef, error: googleError, isReady: googleReady } =
    useGoogleSignIn(handleGoogleIdToken);

  return (
    <>
    {pendingMessage !== null && (
      <EmployerPendingNotice
        message={pendingMessage}
        backLabel="ลองเข้าสู่ระบบอีกครั้ง"
        onBack={() => {
          setPendingMessage(null);
          setStatus("default");
        }}
      />
    )}
    {/* Kept mounted (just hidden) — unmounting would destroy the Google
        button GIS rendered into googleContainerRef. */}
    <form className={styles.form} onSubmit={handleSubmit} noValidate style={pendingMessage !== null ? { display: "none" } : undefined}>
      {(formError || googleError) && (
        <p className={`${styles.formError} ${styles.animateIn}`} role="alert">
          <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V72a8,8,0,0,1,16,0v64a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z" />
          </svg>
          {formError || googleError}
        </p>
      )}

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
        {errors.email && (
          <p id="email-error" className={styles.fieldError}>{errors.email}</p>
        )}
      </div>

      <div className={`${styles.field} ${styles.animateIn} ${styles.delay3}`}>
        <label htmlFor="password">รหัสผ่าน</label>
        <div className={styles.inputWrap}>
        <input
          id="password"
          name="password"
            type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          placeholder="กรอกรหัสผ่านของคุณ"
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
        {errors.password && (
          <p id="password-error" className={styles.fieldError}>{errors.password}</p>
        )}
      </div>

      {/* ลิงก์ "ลืมรหัสผ่าน?" ถูกถอดออกชั่วคราว — ยังไม่มีทั้งหน้า
          /forgot-password และ endpoint ฝั่ง backend ตัวลิงก์เองทำให้
          Next.js prefetch ไปที่ route ที่ไม่มีอยู่ แล้วขึ้น 404 ใน console
          ทุกครั้งที่เปิดหน้า login ใส่กลับเมื่อทำฟีเจอร์รีเซ็ตรหัสผ่านจริง */}

      <button
        type="submit"
        className={`${styles.submitBtn} ${styles.animateIn} ${styles.delay4}`}
        disabled={isLoading}
      >
        {isLoading && <span className={styles.spinner} aria-hidden="true" />}
        {isLoading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
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
    </>
  );
}
