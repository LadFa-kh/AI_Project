"use client";

// Shared floating top navbar — replaces the old sidebar (navbar.tsx +
// mobile-topbar.tsx) on every route. Extracted from Home's original
// floating navbar (components/home/home-hero-demo.tsx) per explicit
// request to use the same dock-style navbar everywhere instead of the
// Stardust sidebar. Uses the global Nocturne accent tokens
// (--color-home-hero-accent-1/2/3, defined in app/globals.css) — those
// tokens were already global, not component-scoped, so reusing them here
// does not violate the "no hardcoded hex" token policy.
//
// Auth state (useAuth()) drives the same signed-in/signed-out branches as
// the old AuthStatus.tsx: signed-out shows เข้าสู่ระบบ/สมัครสมาชิก + Google,
// signed-in shows NAV_ITEMS as dock icons plus an avatar/name dropdown
// (โปรไฟล์/ตั้งค่า/ออกจากระบบ). Google button uses the same
// not-yet-implemented backend contract as LoginForm/RegisterForm.
//
// Fixed/floating positioning means page content needs top padding to clear
// it — see globals.css `--top-nav-height` / .pageWithTopNav usage in
// app-shell.tsx.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { NAV_ITEMS } from "@/components/layout/nav-items";

export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, clearSession } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === "ADMIN");

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await clearSession();
    router.push("/login");
  }

  function handleGoogleSignIn() {
    // TODO: wire to backend auth API — POST /auth/google { idToken }
    // Same not-yet-implemented contract as LoginForm/RegisterForm.
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-20 flex justify-center px-4 sm:top-6">
      <nav
        className="pointer-events-auto flex w-full max-w-[1140px] items-center justify-between rounded-2xl border px-5 py-3 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md"
        style={{ background: "rgba(13,11,22,0.75)", borderColor: "rgba(255,255,255,0.12)" }}
      >
        <Link href="/" className="flex items-center gap-2 text-sm font-bold text-white">
          <span
            className="flex h-[26px] w-[26px] items-center justify-center rounded-lg text-sm"
            style={{
              background:
                "linear-gradient(135deg, var(--color-home-hero-accent-1), var(--color-home-hero-accent-2), var(--color-home-hero-accent-3))",
            }}
          >
            ✦
          </span>
          AI_Project
        </Link>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-1 sm:gap-2">
            <nav aria-label="เมนูหน้าเพจ" className="hidden items-end gap-1.5 md:flex">
              {visibleNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    title={item.label}
                    className="group/dock relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-125 lg:h-10 lg:w-10"
                    style={{
                      color: isActive ? "#ffffff" : "rgba(255,255,255,0.65)",
                      background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                      borderColor: isActive ? "rgba(255,255,255,0.18)" : "transparent",
                    }}
                  >
                    {item.icon}
                    <span
                      className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.6)] transition-opacity duration-150 group-hover/dock:opacity-100"
                      style={{ background: "rgba(13,11,22,0.95)", borderColor: "rgba(255,255,255,0.12)" }}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div ref={menuRef} className="relative flex items-center">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
              >
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white sm:h-8 sm:w-8"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-home-hero-accent-1), var(--color-home-hero-accent-2), var(--color-home-hero-accent-3))",
                  }}
                >
                  {user.fullname.charAt(0).toUpperCase()}
                </span>
                <span className="hidden text-xs font-medium text-white/85 sm:inline sm:text-sm">
                  {user.fullname}
                </span>
                <svg width="12" height="12" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" className="text-white/60">
                  <path d="M213.66,101.66l-72,72a8,8,0,0,1-11.32,0l-72-72A8,8,0,0,1,69.66,90.34L128,148.69l58.34-58.35a8,8,0,0,1,11.32,11.32Z" />
                </svg>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+8px)] w-44 overflow-hidden rounded-xl border py-1 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur-md"
                  style={{ background: "rgba(13,11,22,0.92)", borderColor: "rgba(255,255,255,0.12)" }}
                >
                  <Link
                    href="/profile"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-xs text-white/80 transition-colors hover:bg-white/5 hover:text-white sm:text-sm"
                  >
                    โปรไฟล์
                  </Link>
                  <Link
                    href="/settings"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-xs text-white/80 transition-colors hover:bg-white/5 hover:text-white sm:text-sm"
                  >
                    ตั้งค่า
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-left text-xs text-red-300 transition-colors hover:bg-white/5 sm:text-sm"
                  >
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="text-xs font-medium text-white/70 transition-colors hover:text-white sm:text-sm"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#0a0714] transition-transform hover:-translate-y-0.5 sm:px-4 sm:py-2 sm:text-sm"
            >
              สมัครสมาชิก
            </Link>
            <button
              type="button"
              aria-label="เข้าสู่ระบบด้วย Google"
              title="เข้าสู่ระบบด้วย Google"
              onClick={handleGoogleSignIn}
              className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:bg-white/5 sm:h-9 sm:w-9"
              style={{ borderColor: "rgba(255,255,255,0.15)" }}
            >
              <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.4C29.6 35.4 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.6 39.6 16.3 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.5l6.6 5.4C41.8 35.5 44 30.1 44 24c0-1.2-.1-2.4-.4-3.5z"/>
              </svg>
            </button>
          </div>
        )}
      </nav>
    </div>
  );
}
