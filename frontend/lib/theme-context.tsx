"use client";

// Light/dark theme สำหรับ Nocturne UI — เขียน attribute `data-theme` ลงบน
// <html> ซึ่ง token --nocturne-* ทุกตัวใน globals.css อ่านค่าจากตรงนั้น
// (ไม่ได้ใช้คลาส .dark ของ shadcn เพราะ scaffold ชุดนั้นไม่ได้ถูกใช้งานจริง)
//
// ทำไมต้องเก็บใน cookie ไม่ใช่ localStorage
// -----------------------------------------
// เดิมเก็บใน localStorage แล้วใช้สคริปต์ inline เขียน data-theme ลงบน <html>
// ก่อน React hydrate เพื่อกันจอกระพริบผิดธีม ปัญหาคือ localStorage อ่านได้
// เฉพาะฝั่งเบราว์เซอร์ ฝั่งเซิร์ฟเวอร์จึงเรนเดอร์ <html> โดยไม่มี data-theme
// เสมอ พอถึงตอน hydrate DOM จริงกับ HTML ที่เซิร์ฟเวอร์ส่งมาไม่ตรงกัน React
// จึงล้มทั้งหน้า (error #418 ใน production) ผลคือกดสลับธีมแล้วสีไม่เปลี่ยน
// เพราะ DOM ค้างอยู่ที่สภาพเดิมจากฝั่งเซิร์ฟเวอร์
//
// cookie แก้ปัญหานี้ที่ต้นเหตุ เพราะเบราว์เซอร์แนบมากับทุก request เซิร์ฟเวอร์
// จึงอ่านค่าได้ตั้งแต่ตอนเรนเดอร์ แล้วใส่ data-theme ลงใน HTML ตั้งแต่แรก
// (ดู app/layout.tsx) ฝั่งเซิร์ฟเวอร์กับฝั่งเบราว์เซอร์ตรงกันเป๊ะ ไม่มีอะไรให้
// mismatch อีก ไม่ต้องใช้สคริปต์ inline ไม่ต้องใช้ suppressHydrationWarning
// และไม่กระพริบ เพราะธีมถูกต้องมาตั้งแต่ byte แรกของ HTML
//
// cookie นี้ไม่ใช่ข้อมูลลับ (เป็นแค่ตัวเลือกธีม) จึงตั้ง httpOnly ไม่ได้ —
// ฝั่งเบราว์เซอร์ต้องเขียนเองเวลากดสลับ ใช้ SameSite=Lax และ path=/ ตามปกติ

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

export const THEME_COOKIE = "resumate-theme";

/** 1 ปี — ตัวเลือกธีมควรอยู่ข้ามการปิดเบราว์เซอร์ */
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function writeThemeCookie(theme: Theme) {
  try {
    document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
  } catch {
    // เขียน cookie ไม่ได้ (โหมดส่วนตัวบางแบบ) — ธีมยังใช้ได้ในหน้านี้
    // แค่จะไม่ถูกจำไว้รอบหน้า ไม่ใช่เรื่องคอขาดบาดตาย
  }
}

/**
 * ค่าเริ่มต้นรับมาจาก server component (app/layout.tsx) ซึ่งอ่านจาก cookie
 * เดียวกัน ค่าตั้งต้นของ state จึงตรงกับ HTML ที่เซิร์ฟเวอร์ส่งมาเสมอ
 */
export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: Theme;
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  // เซิร์ฟเวอร์ใส่ data-theme มาให้ถูกต้องแล้วตั้งแต่ HTML ชุดแรก effect นี้จึง
  // ทำงานจริงเฉพาะตอนผู้ใช้กดสลับ (และตอน mount ครั้งแรกซึ่งเขียนทับด้วยค่าเดิม)
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    writeThemeCookie(theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
