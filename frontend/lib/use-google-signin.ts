"use client";

// Google Identity Services (GSI) integration — gets an idToken client-side,
// then hands it to auth-service.ts's loginWithGoogle(idToken), which calls
// POST /auth/google (see README_Admin_API.md screenshot / auth-service.ts).
//
// Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID to be set (see .env.local.example).
// Without it, this hook returns a clear "not configured" error instead of
// silently doing nothing — previously the Google button's onClick was an
// empty stub, which looked like a dead/broken button with no feedback at
// all. Once a real Client ID is added to .env.local, this starts working
// with no code changes needed.
//
// The GSI script (accounts.google.com/gsi/client) is loaded once via
// next/script in app/layout.tsx (id="google-identity-services").

import { useCallback, useRef, useState } from "react";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

type GoogleCredentialResponse = { credential: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          prompt: (
            notification?: (n: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void
          ) => void;
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
        reject(new Error("โหลด Google Sign-In ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"));
      }
    }, 100);
  });
}

export function useGoogleSignIn(onIdToken: (idToken: string) => void | Promise<void>) {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const initialized = useRef(false);

  const start = useCallback(async () => {
    setError(null);

    if (!CLIENT_ID) {
      setError("ยังไม่ได้ตั้งค่า Google Sign-In (NEXT_PUBLIC_GOOGLE_CLIENT_ID) กรุณาติดต่อผู้ดูแลระบบ");
      return;
    }

    setIsStarting(true);
    try {
      await waitForGoogleSdk();

      if (!initialized.current) {
        window.google!.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => {
            void onIdToken(response.credential);
          },
        });
        initialized.current = true;
      }

      window.google!.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setError("ไม่สามารถเปิดหน้าต่างเข้าสู่ระบบ Google ได้ กรุณาตรวจสอบว่าเบราว์เซอร์ไม่ได้บล็อกป็อปอัป");
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sign-In");
    } finally {
      setIsStarting(false);
    }
  }, [onIdToken]);

  return { start, error, isStarting };
}
