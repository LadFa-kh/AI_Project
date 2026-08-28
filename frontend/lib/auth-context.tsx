"use client";

// Session ไม่ได้เก็บใน localStorage แล้ว — backend จะ set cookie `accessToken`
// แบบ httpOnly ให้ตอน login/register/google-login (JavaScript อ่านไม่ได้ =
// กัน XSS ขโมย token) เบราว์เซอร์แนบ cookie ให้เองทุก request ผ่าน
// `credentials: 'include'` ใน api-client.ts
//
// สถานะ auth ที่นี่ได้มาจากการถาม backend ว่า "ฉันคือใคร" (GET /auth/me)
// ครั้งหนึ่งตอน mount แล้ว re-derive ใหม่หลัง login/register/logout
//
// access token มีอายุ 15 นาที และยังไม่มีระบบ refresh — เจอ 401 จาก request
// ถัดไปแปลว่า session หมดอายุ ต้อง login ใหม่ (RouteGuard จัดการ redirect ให้)
//
// เรื่อง same-site: frontend เรียก API ผ่าน path `/api/*` ของตัวเอง แล้ว
// Next.js proxy ต่อไปยัง backend (ดู rewrites ใน next.config.ts) เบราว์เซอร์
// จึงเห็นทุก request เป็น same-origin — cookie `SameSite=Lax` ทำงานได้ทั้ง
// ตอน dev บน localhost และตอน deploy บนโดเมนจริง โดยไม่ต้องพึ่ง
// `SameSite=None` (third-party cookie) ที่เบราว์เซอร์กำลังทยอยเลิกรองรับ

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
import { ApiError } from "./api-client";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** True until the initial GET /auth/me session check completes (avoids a signed-out flash on first paint). */
  isLoading: boolean;
  /**
   * ยืนยันว่า cookie ถูกเก็บจริงแล้วค่อยตั้งสถานะเป็น "เข้าสู่ระบบแล้ว"
   * โยน ApiError(401) ถ้า cookie ใช้ไม่ได้ — ผู้เรียกต้อง await เสมอ
   */
  setSession: (session: AuthSession) => Promise<void>;
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

  // response ของ login/register มีข้อมูล user ติดมาด้วยอยู่แล้ว แต่ "มี
  // response 200" ไม่ได้แปลว่าเบราว์เซอร์เก็บ cookie สำเร็จ (เช่น cookie ติดธง
  // Secure แต่วิ่งบน http, หรือถูกบล็อกด้วยการตั้งค่าเบราว์เซอร์)
  //
  // ถ้าตั้ง user จาก response ตรง ๆ UI จะคิดว่า login สำเร็จแล้วยิง endpoint
  // ที่ต้องยืนยันตัวตนต่อ ได้ 403 รัว ๆ โดยผู้ใช้ไม่รู้ว่าเกิดอะไรขึ้น
  // จึงยิง /auth/me ยืนยันหนึ่งครั้ง — ถ้าไม่ผ่านคือ cookie ใช้ไม่ได้จริง
  // และรายงานความล้มเหลวตรงจุดที่ผู้ใช้กด login แทน
  //
  // accessToken/refreshToken ใน response ถูกทิ้ง — cookie คือ credential จริง
  const setSession = useCallback(async (session: AuthSession) => {
    const { accessToken: _accessToken, refreshToken: _refreshToken, ...rest } = session;

    const confirmed = await getCurrentUser().catch(() => null);
    if (!confirmed) {
      setUser(null);
      throw new ApiError(
        401,
        "เข้าสู่ระบบสำเร็จ แต่เบราว์เซอร์ไม่ได้เก็บคุกกี้ยืนยันตัวตนไว้ " +
          "กรุณาตรวจสอบว่าไม่ได้ปิดการรับคุกกี้ แล้วลองใหม่อีกครั้ง",
        null
      );
    }

    setUser(confirmed ?? rest);
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
