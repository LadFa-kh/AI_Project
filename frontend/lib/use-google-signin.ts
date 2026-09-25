"use client";

// Google Identity Services (GSI) integration — ได้ idToken จากฝั่งเบราว์เซอร์
// แล้วส่งต่อให้ auth-service.ts's loginWithGoogle(idToken) ซึ่งเรียก POST /auth/google
//
// ต้องตั้งค่า NEXT_PUBLIC_GOOGLE_CLIENT_ID (ดู .env.example) และเพิ่ม origin
// ของเว็บใน Google Cloud Console > Credentials > Authorized JavaScript origins
//
// สคริปต์ GSI (accounts.google.com/gsi/client) โหลดครั้งเดียวผ่าน next/script
// ใน app/layout.tsx (id="google-identity-services")
//
// ⚠️ เหตุผลที่ต้องใช้ renderButton แทน prompt():
// เดิมโค้ดเรียก google.accounts.id.prompt() ซึ่งคือกลไก "One Tap" (กล่องเล็ก
// มุมขวาบน) ไม่ใช่ป็อปอัป Chrome กำลังทยอยเลิกรองรับ third-party cookie และ
// เปลี่ยนไปใช้ FedCM ทำให้ One Tap ถูกระงับบ่อยครั้ง (endpoint /gsi/status
// ตอบกลับ 403) เมื่อถูกระงับ callback จะเข้าเงื่อนไข isNotDisplayed() ทำให้
// ผู้ใช้เห็นข้อความว่าป็อปอัปถูกบล็อก ทั้งที่ไม่เคยมีการเปิดป็อปอัปเลย
//
// renderButton สร้างปุ่มที่ Google ควบคุมเอง เมื่อกดจะเปิดหน้าต่างเข้าสู่ระบบ
// จริง (ux_mode: "popup") จึงไม่ขึ้นกับกลไกระงับ One Tap และใช้ callback
// เดียวกันในการรับ credential กลับมา

import { useCallback, useEffect, useRef, useState } from "react";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

type GoogleCredentialResponse = { credential: string };

type ButtonConfig = {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with";
  shape?: "rectangular" | "pill";
  logo_alignment?: "left" | "center";
  width?: number;
  locale?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            ux_mode?: "popup" | "redirect";
            use_fedcm_for_prompt?: boolean;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (parent: HTMLElement, options: ButtonConfig) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

function waitForGoogleSdk(timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(new Error("โหลด Google Sign-In ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่"));
      }
    }, 100);
  });
}

/**
 * คืนค่า containerRef สำหรับผูกกับ <div> ที่จะให้ Google เรนเดอร์ปุ่มลงไป
 * ปุ่มจะถูกสร้างอัตโนมัติเมื่อ SDK พร้อม ไม่ต้องเรียกฟังก์ชันใด ๆ เพิ่ม
 */
// GSI อนุญาตให้ initialize() ได้ครั้งเดียวต่อหนึ่งหน้า ถ้าเรียกซ้ำ config
// ล่าสุดจะทับของเดิมทั้งหมด แล้วขึ้นคำเตือนใน console ว่า
// "google.accounts.id.initialize() is called multiple times"
//
// หน้า /login เรนเดอร์ทั้ง LoginForm และ RegisterForm พร้อมกัน (สลับด้วยการ
// พลิกการ์ด) จึงมี useGoogleSignIn สองตัวทำงานคู่กัน เดิมต่างคนต่างเรียก
// initialize() ทำให้เกิดคำเตือนดังกล่าว และ callback ของตัวที่ initialize
// ทีหลังจะทับของตัวแรกโดยไม่ตั้งใจ
//
// จึงเปลี่ยนมา initialize เพียงครั้งเดียวทั้งหน้า โดยให้ callback กลางไป
// เรียก handler ที่ลงทะเบียนไว้ล่าสุด (พฤติกรรมเท่าเดิมกับที่เป็นอยู่ แต่
// ตั้งใจและไม่มีคำเตือน) — handler ของทั้งสองฟอร์มเรียก loginWithGoogle
// เหมือนกันทุกประการ ต่างกันแค่ข้อความแจ้งข้อผิดพลาด ส่วน renderButton
// ยังเรียกได้อิสระต่อ container แต่ละตัวตามปกติ
type IdTokenHandler = (idToken: string) => void | Promise<void>;
let sdkInitialized = false;
const registeredHandlers: Array<{ current: IdTokenHandler }> = [];

function initializeGoogleOnce() {
  if (sdkInitialized) return;
  window.google!.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (response) => {
      const latest = registeredHandlers[registeredHandlers.length - 1];
      if (latest) void latest.current(response.credential);
    },
    // เปิดหน้าต่างเข้าสู่ระบบจริงแทนการฝังในหน้าเดิม
    ux_mode: "popup",
    // รองรับ FedCM ตามที่ Chrome กำหนดให้เป็นค่ามาตรฐาน
    use_fedcm_for_prompt: true,
    // ไม่เลือกบัญชีให้อัตโนมัติ ผู้ใช้ต้องกดยืนยันทุกครั้ง
    auto_select: false,
  });
  sdkInitialized = true;
}

export function useGoogleSignIn(onIdToken: (idToken: string) => void | Promise<void>) {
  // Missing client id is known at render time — no need to set it from an effect.
  const [error, setError] = useState<string | null>(
    CLIENT_ID ? null : "ยังไม่ได้ตั้งค่า Google Sign-In (NEXT_PUBLIC_GOOGLE_CLIENT_ID) กรุณาติดต่อผู้ดูแลระบบ"
  );
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // เก็บ callback ล่าสุดไว้ใน ref เพื่อไม่ให้ต้องเรนเดอร์ปุ่มใหม่ทุกครั้งที่
  // component ข้างนอกสร้างฟังก์ชันขึ้นมาใหม่
  const handlerRef = useRef(onIdToken);
  // Refs must not be written during render (react-hooks/refs) — sync after commit.
  useEffect(() => {
    handlerRef.current = onIdToken;
  }, [onIdToken]);

  useEffect(() => {
    let cancelled = false;

    if (!CLIENT_ID) return;

    (async () => {
      try {
        await waitForGoogleSdk();
        if (cancelled || !containerRef.current) return;

        initializeGoogleOnce();

        containerRef.current.innerHTML = "";
        window.google!.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: 320,
          locale: "th",
        });

        if (!cancelled) setIsReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sign-In");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ลงทะเบียน handler ของ instance นี้ไว้กับ callback กลาง และถอนออกตอน unmount
  useEffect(() => {
    registeredHandlers.push(handlerRef);
    return () => {
      const i = registeredHandlers.indexOf(handlerRef);
      if (i !== -1) registeredHandlers.splice(i, 1);
    };
  }, []);

  /** เรียกตอนออกจากระบบ เพื่อไม่ให้ Google เลือกบัญชีเดิมให้อัตโนมัติในครั้งถัดไป */
  const reset = useCallback(() => {
    try {
      window.google?.accounts.id.disableAutoSelect();
    } catch {
      // ไม่ต้องทำอะไร หาก SDK ยังไม่พร้อม
    }
  }, []);

  return { containerRef, error, isReady, reset };
}
