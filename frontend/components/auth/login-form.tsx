"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import styles from "./login.module.css";

type FieldErrors = {
  email?: string | null;
  password?: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(value: string): string | null {
  if (!value.trim()) return "Enter your email address.";
  if (!EMAIL_RE.test(value)) return "Enter a valid email address.";
  return null;
}

function validatePassword(value: string): string | null {
  if (!value) return "Enter your password.";
  return null;
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      // TODO: wire to backend auth API — POST /auth/login { email, password } (see PROJECT_CONTEXT.md)
      await new Promise<void>((resolve, reject) =>
        setTimeout(() => reject(new Error("invalid_credentials")), 800)
      );
      setStatus("default");
    } catch {
      setStatus("error");
      setFormError("Incorrect email or password. Please try again.");
    }
  }

  function handleGoogleSignIn() {
    // TODO: wire to backend auth API — POST /auth/google { idToken }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {formError && (
        <p className={styles.formError} role="alert">
          <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V72a8,8,0,0,1,16,0v64a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z" />
          </svg>
          {formError}
        </p>
      )}

      <div className={styles.field}>
        <label htmlFor="email">Email</label>
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

      <div className={styles.field}>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          placeholder="Enter your password"
          className={`${styles.input} ${errors.password ? styles.inputInvalid : ""}`}
        />
        {errors.password && (
          <p id="password-error" className={styles.fieldError}>{errors.password}</p>
        )}
      </div>

      <div className={styles.helpRow}>
        <Link href="/forgot-password" className={styles.link}>Forgot password?</Link>
      </div>

      <button type="submit" className={styles.submitBtn} disabled={isLoading}>
        {isLoading && <span className={styles.spinner} aria-hidden="true" />}
        {isLoading ? "Logging in…" : "Log in"}
      </button>

      <div className={styles.divider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>or</span>
        <span className={styles.dividerLine} />
      </div>

      <button
        type="button"
        className={styles.googleBtn}
        disabled={isLoading}
        onClick={handleGoogleSignIn}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.73-2.46 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-4v3.11A12 12 0 0 0 12 24Z" />
          <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58v-3.1h-4a12 12 0 0 0 0 10.79l4-3.11Z" />
          <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.1C6.22 6.86 8.87 4.75 12 4.75Z" />
        </svg>
        Continue with Google
      </button>
    </form>
  );
}
