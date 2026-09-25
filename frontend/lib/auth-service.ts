// Auth API calls. Endpoints confirmed against live backend Swagger UI:
// POST /auth/login    { email, password }            -> { status, message, data: { userId, email, fullname, role, accessToken, refreshToken } }
// POST /auth/register { email, password, fullname, telephone?, acceptedPolicyVersion?,
//                       role?: "EMPLOYER", companyName?, companyTaxId? } -> same shape as login
// (no role = STUDENT; role EMPLOYER → 201 + code EMPLOYER_PENDING, no cookie — API_CHANGES.md §5.5)
//
// Auth runs on an httpOnly `accessToken` cookie set automatically by the
// browser on login/register/google-login (see api-client.ts's
// `credentials: 'include'`). The accessToken/refreshToken still present in
// the login/register response bodies are kept only for backward compat per
// the backend team — the frontend must NOT read or store them; session
// state is sourced from getCurrentUser() (GET /auth/me) instead.
//
// เรื่อง same-site: frontend เรียก API ผ่าน path /api/* ของตัวเอง แล้ว
// Next.js proxy ต่อไปยัง backend (rewrites ใน next.config.ts) เบราว์เซอร์จึง
// เห็นทุกอย่างอยู่บน origin เดียวกัน — cookie `SameSite=Lax` แบบ host-only
// ทำงานได้ทั้งตอน dev บน localhost และตอน deploy บนโดเมนจริง
//
// backend ตัด fallback แบบส่ง userId จาก client ทิ้งไปหมดแล้วใน
// /resumes/upload, /assessments/submit และ /matching/recommendations —
// cookie auth คือทางเดียวที่เข้าถึงได้
//
// GET  /auth/me      -> 200 { userId, email, fullName, role, authProvider } if logged in, 401 if not/expired
// POST /auth/logout  -> clears the httpOnly cookie server-side (JS cannot delete an httpOnly cookie itself)
// POST /auth/google  { idToken } -> same response shape as login

import { apiFetch, ApiError } from "./api-client";

export type AccountStatus = "ACTIVE" | "PENDING" | "REJECTED" | "SUSPENDED";

export type AuthUser = {
  userId: string;
  email: string;
  fullname: string;
  role: string;
  // Added in backend round B5/B9 (API_CHANGES.md §5.5, §5.9) — optional so
  // older responses/sessions without them still type-check.
  accountStatus?: AccountStatus;
  /** true = user must (re)accept the current privacy policy → ConsentModal. */
  needsConsent?: boolean;
  /** From GET /auth/me (e.g. "GOOGLE" / "LOCAL") — decides the delete-account confirmation (B9). */
  authProvider?: string;
};

export type AuthSession = AuthUser & {
  accessToken: string | null;
  refreshToken?: string | null;
};

export type RegisterRole = "STUDENT" | "EMPLOYER";

export type RegisterInput = {
  email: string;
  password: string;
  fullname: string;
  telephone?: string;
  /** Omit (or STUDENT) for a normal student account. */
  role?: RegisterRole;
  /** Required by the form when role = EMPLOYER. */
  companyName?: string;
  /** Optional, 10–13 digits. */
  companyTaxId?: string;
  /** Version from GET /policies/current the user ticked "accept" for. */
  acceptedPolicyVersion?: string;
};

/**
 * - `session`: account is usable now (cookie set) — students.
 * - `pending`: employer account created but waits for admin approval;
 *   no cookie, cannot log in yet (code EMPLOYER_PENDING, HTTP 201).
 */
export type RegisterResult =
  | { kind: "session"; session: AuthSession }
  | { kind: "pending"; message: string };

export type PolicyInfo = {
  policyType: string;
  version: string;
  url: string;
  effectiveDate: string;
  requiredOnRegister: boolean;
};

type ApiEnvelope<T> = {
  status: number;
  message: string;
  code?: string;
  data: T;
};

// GET /auth/me returns `fullName` (capital N) — different casing from the
// `fullname` field login/register use. Normalized to AuthUser's `fullname`
// below so the rest of the app only deals with one casing.
type CurrentUserResponse = {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  authProvider?: string;
  accountStatus?: AccountStatus;
  needsConsent?: boolean;
};

export async function login(email: string, password: string): Promise<AuthSession> {
  const res = await apiFetch<ApiEnvelope<AuthSession>>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return res.data;
}

// Only sends the fields that apply — per API_CHANGES.md §5.5, don't send
// extra/empty fields (e.g. no `role` at all for students).
export async function register(input: RegisterInput): Promise<RegisterResult> {
  const body: Record<string, string> = {
    email: input.email,
    password: input.password,
    fullname: input.fullname,
  };
  if (input.telephone) body.telephone = input.telephone;
  if (input.acceptedPolicyVersion) body.acceptedPolicyVersion = input.acceptedPolicyVersion;
  if (input.role === "EMPLOYER") {
    body.role = "EMPLOYER";
    if (input.companyName) body.companyName = input.companyName;
    if (input.companyTaxId) body.companyTaxId = input.companyTaxId;
  }

  const res = await apiFetch<ApiEnvelope<AuthSession>>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (res.code === "EMPLOYER_PENDING" || res.data?.accountStatus === "PENDING") {
    return { kind: "pending", message: res.message };
  }
  return { kind: "session", session: res.data };
}

// Public — no login needed. Used by the register form / consent modal to
// know which policy version the user is accepting.
export async function getCurrentPolicy(): Promise<PolicyInfo> {
  const res = await apiFetch<ApiEnvelope<PolicyInfo>>("/policies/current", { method: "GET" });
  return res.data;
}

// Records consent for the logged-in user (after login returned
// needsConsent: true). Body per API_CHANGES.md §5.9: { version }.
export async function acceptPolicy(version: string): Promise<void> {
  await apiFetch<unknown>("/users/me/consents", {
    method: "POST",
    body: JSON.stringify({ version }),
  });
}

export async function loginWithGoogle(idToken: string): Promise<AuthSession> {
  const res = await apiFetch<ApiEnvelope<AuthSession>>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
  return res.data;
}

// Session-check — call on mount/refresh to hydrate auth state from the
// httpOnly cookie. Returns null (not a thrown error) on 401, since "not
// logged in" is an expected, common state, not a failure.
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // ⚠️ /auth/me ห่อข้อมูลไว้ใน ApiResponse envelope ({status, message, data})
    // เหมือน /auth/login และ /auth/register ไม่ได้คืนค่าแบบแบนราบ
    // เดิมโค้ดอ่าน res.role ตรง ๆ ทำให้ได้ undefined ทุก field ผลคือ
    // AdminGuard มองว่าไม่ใช่ ADMIN และเด้งผู้ดูแลระบบกลับหน้าแรกเสมอ
    //
    // เผื่อกรณีที่ backend เปลี่ยนไปคืนค่าแบบแบนราบในอนาคต จึงรองรับทั้งสองรูปแบบ
    const raw = await apiFetch<ApiEnvelope<CurrentUserResponse> | CurrentUserResponse>(
      "/auth/me",
      { method: "GET" }
    );
    const res = (raw as ApiEnvelope<CurrentUserResponse>).data ?? (raw as CurrentUserResponse);
    return {
      userId: res.userId,
      email: res.email,
      fullname: res.fullName,
      role: res.role,
      accountStatus: res.accountStatus,
      needsConsent: res.needsConsent,
      authProvider: res.authProvider,
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

// Clears the httpOnly cookie server-side. Must be called on logout — simply
// discarding local state is not enough since JS cannot delete an httpOnly
// cookie itself.
export async function logout(): Promise<void> {
  await apiFetch<void>("/auth/logout", { method: "POST" });
}
