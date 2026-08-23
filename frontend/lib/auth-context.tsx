"use client";

// Session is no longer stored in localStorage — backend sets an httpOnly
// `accessToken` cookie on login/register/google-login (unreadable by JS,
// sent automatically by the browser via api-client.ts's
// `credentials: 'include'`). Auth state here is instead hydrated by asking
// the backend "who am I" (GET /auth/me) once on mount, and re-derived after
// login/register/logout. The access token expires in 15 minutes with no
// refresh mechanism yet — a 401 from a later request means the session has
// expired and the user must log in again (RouteGuard handles the redirect).
//
// REQUIRES the frontend to be deployed same-site with the backend (a
// subdomain of recommendation.site, e.g. app.recommendation.site — see the
// repo-root Caddyfile/docker-compose.yml) — backend's cookie is
// `SameSite=Lax` with no explicit `Domain=`, so a cross-site origin (like
// localhost:3000 during local dev) never receives or sends it at all, and
// every request below will resolve to a signed-out state / 401. This is a
// known limitation until the app is actually deployed at its real domain.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthSession, AuthUser } from "./auth-service";
import { getCurrentUser, logout as logoutRequest } from "./auth-service";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** True until the initial GET /auth/me session check completes (avoids a signed-out flash on first paint). */
  isLoading: boolean;
  setSession: (session: AuthSession) => void;
  clearSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from the backend once on mount — the cookie (if any) travels
  // automatically with this request.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const current = await getCurrentUser();
        if (!cancelled) setUser(current);
      } catch {
        // Network/server error on the session check — treat as signed-out
        // rather than blocking the app indefinitely.
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Login/register responses already include the user fields inline, so we
  // can set state directly without an extra /auth/me round-trip. The
  // accessToken/refreshToken in the response are ignored — the cookie is
  // the real credential now.
  const setSession = useCallback((session: AuthSession) => {
    const { accessToken: _accessToken, refreshToken: _refreshToken, ...rest } = session;
    setUser(rest);
  }, []);

  const clearSession = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Even if the server call fails (already expired, network hiccup),
      // still clear local state below so the UI reflects signed-out.
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      setSession,
      clearSession,
    }),
    [user, isLoading, setSession, clearSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
