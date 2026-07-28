"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
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
  if (!value.trim()) return "Enter your full name.";
  return null;
}

function validateEmail(value: string): string | null {
  if (!value.trim()) return "Enter your email address.";
  if (!EMAIL_RE.test(value)) return "Enter a valid email address.";
  return null;
}

function validatePassword(value: string): string | null {
  if (!value) return "Enter a password.";
  if (value.length < 8) return "Use at least 8 characters.";
  return null;
}

function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) return "Confirm your password.";
  if (confirm !== password) return "Passwords don't match.";
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

  if (score <= 1) return { score: 1, label: "Weak", color: "oklch(70% 0.15 25)" };
  if (score <= 3) return { score: 2, label: "Okay", color: "oklch(78% 0.14 85)" };
  return { score: 3, label: "Strong", color: "oklch(75% 0.14 150)" };
}

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      terms: agreedToTerms ? null : "You must accept the Terms and Privacy Policy.",
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
      // TODO: wire to backend auth API — POST /auth/register { name, email, password } -> { accessToken, user } (see PROJECT_CONTEXT.md)
      await new Promise<void>((resolve, reject) =>
        setTimeout(() => reject(new Error("email_taken")), 800)
      );
      setStatus("default");
    } catch {
      setStatus("error");
      setFormError("An account with this email already exists.");
    }
  }

  function handleGoogleSignIn() {
    // TODO: wire to backend auth API — POST /auth/google { idToken }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {formError && (
        <p className={`${styles.formError} ${styles.animateIn}`} role="alert">
          <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V72a8,8,0,0,1,16,0v64a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z" />
          </svg>
          {formError}
        </p>
      )}

      <div className={`${styles.field} ${styles.animateIn} ${styles.delay3}`}>
        <label htmlFor="name">Full name</label>
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
          placeholder="Jordan Lee"
          className={`${styles.input} ${errors.name ? styles.inputInvalid : ""}`}
        />
        {errors.name && <p id="name-error" className={styles.fieldError}>{errors.name}</p>}
      </div>

      <div className={`${styles.field} ${styles.animateIn} ${styles.delay3}`}>
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
        {errors.email && <p id="email-error" className={styles.fieldError}>{errors.email}</p>}
      </div>

      <div className={`${styles.field} ${styles.animateIn} ${styles.delay3}`}>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : "password-strength"}
          placeholder="At least 8 characters"
          className={`${styles.input} ${errors.password ? styles.inputInvalid : ""}`}
        />
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
        <label htmlFor="confirmPassword">Confirm password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
          placeholder="Re-enter your password"
          className={`${styles.input} ${errors.confirmPassword ? styles.inputInvalid : ""}`}
        />
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
          I agree to the <a href="/terms" className={styles.link} style={{ display: "inline", minHeight: "auto" }}>Terms of Service</a> and{" "}
          <a href="/privacy" className={styles.link} style={{ display: "inline", minHeight: "auto" }}>Privacy Policy</a>.
        </label>
      </div>
      {errors.terms && <p id="terms-error" className={styles.fieldError} style={{ marginTop: "-8px" }}>{errors.terms}</p>}

      <button
        type="submit"
        className={`${styles.submitBtn} ${styles.animateIn} ${styles.delay4}`}
        disabled={isLoading}
      >
        {isLoading && <span className={styles.spinner} aria-hidden="true" />}
        {isLoading ? "Creating account…" : "Create account"}
      </button>

      <div className={`${styles.divider} ${styles.animateIn} ${styles.delay4}`}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>or</span>
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
        Continue with Google
      </button>
    </form>
  );
}
