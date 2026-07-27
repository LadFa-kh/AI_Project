"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { GoogleSignInButton } from "./google-signin-button";
import {
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validatePassword,
} from "@/lib/validators";

type AuthMode = "login" | "register";

type FieldErrors = {
  fullName?: string | null;
  email?: string | null;
  password?: string | null;
  confirmPassword?: string | null;
};

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const isRegister = mode === "register";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"default" | "loading" | "error">(
    "default"
  );
  const [formError, setFormError] = useState<string | null>(null);

  function validate(): boolean {
    const nextErrors: FieldErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };
    if (isRegister) {
      nextErrors.fullName = validateFullName(fullName);
      nextErrors.confirmPassword = validateConfirmPassword(
        password,
        confirmPassword
      );
    }
    setErrors(nextErrors);
    return Object.values(nextErrors).every((err) => !err);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (!validate()) return;

    setStatus("loading");
    try {
      // TODO: wire to backend auth API (see PROJECT_CONTEXT.md contract)
      await new Promise((resolve) => setTimeout(resolve, 800));
      setStatus("default");
    } catch {
      setStatus("error");
      setFormError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    }
  }

  const isLoading = status === "loading";

  return (
    <div className="w-full max-w-sm mx-auto" style={{ maxWidth: "min(24rem, 90vw)" }}>
      <h1 className="text-[clamp(1.375rem,1.1rem+1.2vw,1.5rem)] font-semibold text-zinc-900 dark:text-zinc-50 text-center">
        {isRegister ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
      </h1>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 flex flex-col gap-4"
      >
        {formError && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          >
            {formError}
          </p>
        )}

        {isRegister && (
          <div className="flex flex-col gap-1">
            <label
              htmlFor="fullName"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              ชื่อ-นามสกุล
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
              className="h-11 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="เช่น สมชาย ใจดี"
            />
            {errors.fullName && (
              <p id="fullName-error" className="text-xs text-red-600 dark:text-red-400">
                {errors.fullName}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label
            htmlFor="email"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            อีเมล
          </label>
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
            className="h-11 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-red-600 dark:text-red-400">
              {errors.email}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="password"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            รหัสผ่าน
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : "password-help"}
            className="h-11 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="อย่างน้อย 8 ตัวอักษร"
          />
          {errors.password ? (
            <p id="password-error" className="text-xs text-red-600 dark:text-red-400">
              {errors.password}
            </p>
          ) : (
            <p id="password-help" className="text-xs text-zinc-500 dark:text-zinc-400">
              รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร
            </p>
          )}
        </div>

        {isRegister && (
          <div className="flex flex-col gap-1">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              ยืนยันรหัสผ่าน
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword ? "confirmPassword-error" : undefined
              }
              className="h-11 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="กรอกรหัสผ่านอีกครั้ง"
            />
            {errors.confirmPassword && (
              <p
                id="confirmPassword-error"
                className="text-xs text-red-600 dark:text-red-400"
              >
                {errors.confirmPassword}
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 h-11 w-full rounded-lg bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isLoading ? "กำลังดำเนินการ..." : isRegister ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
        </button>
      </form>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">หรือ</span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="mt-4">
        <GoogleSignInButton disabled={isLoading} />
      </div>

      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        {isRegister ? (
          <>
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/login" className="font-medium text-zinc-900 underline dark:text-zinc-50">
              เข้าสู่ระบบ
            </Link>
          </>
        ) : (
          <>
            ยังไม่มีบัญชี?{" "}
            <Link href="/register" className="font-medium text-zinc-900 underline dark:text-zinc-50">
              สมัครสมาชิก
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
