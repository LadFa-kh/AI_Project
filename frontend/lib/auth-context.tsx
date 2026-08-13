"use client";

// Session persisted to localStorage so it survives a page refresh — stores
// the accessToken/refreshToken/user backend already returns on login/register,
// under a single JSON key (STORAGE_KEY) to avoid partial/mismatched reads.
// NOTE: storing tokens in localStorage is readable by any JS on the page
// (XSS risk) — acceptable tradeoff for this MVP per explicit product
// decision; revisit with an httpOnly cookie if backend adds one later.

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

const STORAGE_KEY = "auth-session";

type StoredSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

function readStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.user) return null;
    return parsed as StoredSession;
  } catch {
    return null;
  }
}

function writeStoredSession(session: StoredSession) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage unavailable (private browsing, quota) — session still works
    // in-memory for this tab, just won't survive a refresh.
  }
}

function clearStoredSession() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

type AuthContextValue = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** True until the initial localStorage read completes (avoids a signed-out flash on first paint). */
  isLoading: boolean;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage once on mount (client-only — SSR has no window).
  useEffect(() => {
    const stored = readStoredSession();
    if (stored) {
      setAccessToken(stored.accessToken);
      setRefreshToken(stored.refreshToken);
      setUser(stored.user);
    }
    setIsLoading(false);
  }, []);

  const setSession = useCallback((session: AuthSession) => {
    const { accessToken: token, refreshToken: refresh, ...rest } = session;
    setAccessToken(token);
    setRefreshToken(refresh);
    setUser(rest);
    writeStoredSession({ accessToken: token, refreshToken: refresh, user: rest });
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    clearStoredSession();
  }, []);

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken,
      user,
      isAuthenticated: !!accessToken,
      isLoading,
      setSession,
      clearSession,
    }),
    [accessToken, refreshToken, user, isLoading, setSession, clearSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
