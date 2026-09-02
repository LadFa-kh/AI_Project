"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";
import { login, loginWithGoogle } from "@/lib/auth-service";
import { ApiError, NetworkError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useGoogleSignIn } from "@/lib/use-google-signin";
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
      setSession(session);
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
        setSession(session);
        setStatus("default");
        router.push("/");
      } catch (err) {
        setStatus("error");
        setFormError(
          err instanceof ApiError || err instanceof NetworkError
            ? err.message
            : "เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
        );
      }
    },
    [router, setSession]
  );

  const { start: handleGoogleSignIn, error: googleError } = useGoogleSignIn(handleGoogleIdToken);

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

      <div className={`${styles.helpRow} ${styles.animateIn} ${styles.delay3}`}>
        <Link href="/forgot-password" className={styles.link}>ลืมรหัสผ่าน?</Link>
      </div>

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

      <button
        type="button"
        className={`${styles.googleBtn} ${styles.animateIn} ${styles.delay4}`}
        disabled={isLoading}
        onClick={handleGoogleSignIn}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.73-2.46 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-4v3.11A12 12 0 0 0 12 24Z" />
          <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58v-3.1h-4a12 12 0 0 0 0 10.79l4-3.11Z" />
          <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.1C6.22 6.86 8.87 4.75 12 4.75Z" />
        </svg>
        เข้าสู่ระบบด้วย Google
      </button>
    </form>
  );
}
