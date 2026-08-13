// Auth API calls. Endpoints confirmed against live backend Swagger UI
// (recommendation.site):
// POST /auth/login    { email, password }            -> { status, message, data: { userId, email, fullname, role, accessToken, refreshToken } }
// POST /auth/register { email, password, fullname }  -> { status, message, data: { userId, email, fullname, role, accessToken, refreshToken } }
// (role defaults server-side to STUDENT on register — not sent by the client)

import { apiFetch } from "./api-client";

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
  fullname: string
): Promise<AuthSession> {
  const res = await apiFetch<ApiEnvelope<AuthSession>>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, fullname }),
  });
  return res.data;
}
