// Central fetch wrapper for all backend calls. Base URL comes from
// NEXT_PUBLIC_API_BASE_URL — ปกติเป็น "/api/v1" (path ล้วน) ซึ่งวิ่งผ่าน
// rewrites proxy ใน next.config.ts ไปยัง backend ทำให้ทุก request เป็น
// same-origin ไม่มี CORS และ cookie ทำงานได้ทั้ง dev และ prod
// Splits failures into
// two shapes so callers can show the right message:
// - ApiError: request reached the server, server returned a non-2xx status
// - NetworkError: request never got a response (offline, CORS, DNS, timeout)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/** Absolute-or-proxied URL for links/downloads that bypass apiFetch (e.g. CSV template). */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  /** Machine-readable error code from the backend (API_CHANGES.md §5.0),
   *  e.g. "EMPLOYER_PENDING", "EMAIL_TAKEN". Branch on this, never on
   *  `message` — backend may reword messages, codes stay stable. */
  code: string | null;
  /** Seconds from the `Retry-After` header (sent with 429 RATE_LIMITED). */
  retryAfter: number | null;

  constructor(status: number, message: string, body: unknown, retryAfter: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.code = extractErrorCode(body);
    this.retryAfter = retryAfter;
  }
}

function extractErrorCode(body: unknown): string | null {
  if (body && typeof body === "object") {
    const code = (body as Record<string, unknown>).code;
    if (typeof code === "string" && code.trim()) return code;
  }
  return null;
}

/** Unwraps the backend's `{ status, message, data }` envelope when present;
 *  returns the body as-is otherwise (some endpoints return bare JSON). */
export function unwrap<T>(res: unknown): T {
  if (res && typeof res === "object" && "data" in res && "status" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

/** Normalizes a list response: bare array, envelope, or paginated `{ content }`. */
export function unwrapList<T>(res: unknown): T[] {
  const data = unwrap<T[] | { content?: T[] } | null>(res);
  if (Array.isArray(data)) return data;
  return data?.content ?? [];
}

/** Returns the backend error `code` if `err` is an ApiError that has one. */
export function getErrorCode(err: unknown): string | null {
  return err instanceof ApiError ? err.code : null;
}

export class NetworkError extends Error {
  constructor(message = "Network request failed. Check your connection and try again.") {
    super(message);
    this.name = "NetworkError";
  }
}

// Best-effort extraction of a human-readable message from an error response
// body. Backend shape isn't finalized, so this checks a few common keys
// before falling back to a generic message.
function extractErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const candidate = record.message ?? record.error ?? record.detail;
    if (typeof candidate === "string" && candidate.trim()) return candidate;
    if (Array.isArray(candidate) && typeof candidate[0] === "string") return candidate[0];
  }
  return `Request failed with status ${status}.`;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      // Backend authenticates via an httpOnly `accessToken` cookie (set
      // automatically on login/register/google-login) instead of a
      // client-managed JWT. `credentials: 'include'` is required on every
      // request so the browser attaches that cookie — without it, protected
      // endpoints return 403 even right after a successful login.
      credentials: "include",
      headers: {
        // Only set Content-Type when there's a body to describe — sending it
        // on bodyless GETs forces an unnecessary CORS preflight (OPTIONS)
        // that some backend endpoints (e.g. /skills/search) aren't
        // configured to answer, which fails the whole request.
        // FormData (file upload) must NOT get a Content-Type — the browser
        // sets multipart/form-data with the boundary itself.
        ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    // fetch() itself threw: offline, DNS failure, or CORS blocked the
    // request before a response was received.
    throw new NetworkError();
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    const retryHeader = Number(response.headers.get("retry-after"));
    throw new ApiError(
      response.status,
      extractErrorMessage(body, response.status),
      body,
      Number.isFinite(retryHeader) && retryHeader > 0 ? retryHeader : null
    );
  }

  return body as T;
}

// Thai copy for error codes where the backend message alone isn't enough
// (API_CHANGES.md §5.0). Anything not listed falls back to the backend's
// own `message`, then to `fallback`.
export function describeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case "RATE_LIMITED":
        return err.retryAfter
          ? `ส่งคำขอถี่เกินไป กรุณารอ ${err.retryAfter} วินาทีแล้วลองใหม่`
          : "ส่งคำขอถี่เกินไป กรุณารอสักครู่แล้วลองใหม่";
      case "CREDITS_EXHAUSTED":
        return "เครดิตการใช้งานของเดือนนี้หมดแล้ว กรุณารอรอบถัดไป";
      case "EMAIL_TAKEN":
        return "อีเมลนี้ถูกใช้สมัครแล้ว";
      case "TELEPHONE_TAKEN":
        return "เบอร์โทรนี้ถูกใช้สมัครแล้ว";
      case "CONSENT_REQUIRED":
        return "กรุณายอมรับนโยบายความเป็นส่วนตัวก่อนสมัครสมาชิก";
      case "NOT_JOB_OWNER":
        return "คุณไม่ใช่เจ้าของประกาศนี้ จึงแก้ไขไม่ได้";
      case "POLICY_VERSION_MISMATCH":
        return "นโยบายความเป็นส่วนตัวมีการอัปเดต กรุณารีเฟรชหน้าแล้วยอมรับนโยบายฉบับล่าสุด";
      case "CONFIRMATION_FAILED":
        return "ข้อมูลยืนยันไม่ถูกต้อง กรุณาตรวจสอบแล้วลองใหม่";
    }
    return err.message || fallback;
  }
  if (err instanceof NetworkError) return err.message;
  return fallback;
}
