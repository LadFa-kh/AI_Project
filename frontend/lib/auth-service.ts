// Auth API calls. Endpoints confirmed against live backend Swagger UI
// (recommendation.site):
// POST /auth/login    { email, password }            -> { status, message, data: { userId, email, fullname, role, accessToken, refreshToken } }
// POST /auth/register { email, password, fullname, telephone? } -> same shape as login
// (role defaults server-side to STUDENT on register — not sent by the client)
//
// Auth runs on an httpOnly `accessToken` cookie set automatically by the
// browser on login/register/google-login (see api-client.ts's
// `credentials: 'include'`). The accessToken/refreshToken still present in
// the login/register response bodies are kept only for backward compat per
// the backend team — the frontend must NOT read or store them; session
// state is sourced from getCurrentUser() (GET /auth/me) instead.
//
// IMPORTANT — this only works when the frontend is same-site with the
// backend (recommendation.site). Backend's Set-Cookie has `SameSite=Lax`
// with no explicit `Domain=`, so it's a host-only cookie scoped to
// recommendation.site; a cross-site caller (e.g. localhost:3000) never
// receives/sends it at all. Deploy the frontend at a subdomain of
// recommendation.site (e.g. app.recommendation.site, see the repo-root
// Caddyfile/docker-compose.yml) so browser requests to the backend count
// as same-site. Confirmed backend also removed the old userId-based
// fallback entirely on /resumes/upload, /assessments/submit, and
// /matching/recommendations — cookie auth is the only way in now, local
// dev on a different origin cannot reach these endpoints until deployed.
//
// GET  /auth/me      -> 200 { userId, email, fullName, role, authProvider } if logged in, 401 if not/expired
// POST /auth/logout  -> clears the httpOnly cookie server-side (JS cannot delete an httpOnly cookie itself)
// POST /auth/google  { idToken } -> same response shape as login

import { apiFetch, ApiError } from "./api-client";

export type AuthUser = {
  userId: string;
  email: string;
  fullname: string;
  role: string;
};

export type AuthSession = AuthUser & {
  accessToken: string;
  refreshToken: string;
};

type ApiEnvelope<T> = {
  status: number;
  message: string;
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
};

export async function login(email: string, password: string): Promise<AuthSession> {
  const res = await apiFetch<ApiEnvelope<AuthSession>>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return res.data;
}

export async function register(
  email: string,
  password: string,
  fullname: string,
  telephone?: string
): Promise<AuthSession> {
  const res = await apiFetch<ApiEnvelope<AuthSession>>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, fullname, ...(telephone ? { telephone } : {}) }),
  });
  return res.data;
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
    const res = await apiFetch<CurrentUserResponse>("/auth/me", { method: "GET" });
    return {
      userId: res.userId,
      email: res.email,
      fullname: res.fullName,
      role: res.role,
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
