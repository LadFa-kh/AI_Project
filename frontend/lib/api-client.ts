// Central fetch wrapper for all backend calls. Base URL comes from
// NEXT_PUBLIC_API_BASE_URL (see .env.local.example). Splits failures into
// two shapes so callers can show the right message:
// - ApiError: request reached the server, server returned a non-2xx status
// - NetworkError: request never got a response (offline, CORS, DNS, timeout)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
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
      // endpoints return 403 even right after a successful login. Only
      // works when the frontend is same-site with the backend (e.g. served
      // from app.recommendation.site) — see auth-context.tsx.
      credentials: "include",
      headers: {
        // Only set Content-Type when there's a body to describe — sending it
        // on bodyless GETs forces an unnecessary CORS preflight (OPTIONS)
        // that some backend endpoints (e.g. /skills/search) aren't
        // configured to answer, which fails the whole request.
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
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
    throw new ApiError(response.status, extractErrorMessage(body, response.status), body);
  }

  return body as T;
}
