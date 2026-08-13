"use client";

// Shared auth footer for the sidebar (navbar.tsx) and mobile drawer
// (mobile-topbar.tsx): shows Login/Register/Google links when signed out,
// or an avatar/name/role card with a Profile/Settings/Logout dropdown when
// signed in. `isCollapsed` only applies to the desktop sidebar variant
// (mobile drawer is never collapsed).

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import nocturne from "@/components/ui/nocturne.module.css";
import styles from "./auth-status.module.css";

type AuthStatusProps = {
  isCollapsed?: boolean;
  onNavigate?: () => void;
};

export function AuthStatus({ isCollapsed = false, onNavigate }: AuthStatusProps) {
  const router = useRouter();
  const { user, isAuthenticated, clearSession } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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

  if (isAuthenticated && user) {
    function handleLogout() {
      setMenuOpen(false);
      clearSession();
      onNavigate?.();
      router.push("/login");
    }

    const initial = user.fullname.charAt(0).toUpperCase();
    const roleLabel = user.role.charAt(0) + user.role.slice(1).toLowerCase();

    return (
      <div ref={containerRef} className={styles.userCard}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className={styles.userCardTrigger}
          title={isCollapsed ? user.fullname : undefined}
        >
          <span className={styles.avatar} aria-hidden="true">{initial}</span>
          {!isCollapsed && (
            <span className={styles.userCardText}>
              <span className={styles.userName}>{user.fullname}</span>
              <span className={styles.userRole}>{roleLabel}</span>
            </span>
          )}
          {!isCollapsed && (
            <span className={styles.userCardChevron} aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
                <path d="M213.66,101.66l-72,72a8,8,0,0,1-11.32,0l-72-72A8,8,0,0,1,69.66,90.34L128,148.69l58.34-58.35a8,8,0,0,1,11.32,11.32Z" />
              </svg>
            </span>
          )}
        </button>

        {menuOpen && (
          <div role="menu" className={styles.userMenu}>
            <Link
              href="/profile"
              role="menuitem"
              className={styles.userMenuItem}
              onClick={() => {
                setMenuOpen(false);
                onNavigate?.();
              }}
            >
              Profile
            </Link>
            <Link
              href="/settings"
              role="menuitem"
              className={styles.userMenuItem}
              onClick={() => {
                setMenuOpen(false);
                onNavigate?.();
              }}
            >
              Settings
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className={`${styles.userMenuItem} ${styles.userMenuItemDanger}`}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={nocturne.sidebarFooterRow}>
        <Link
          href="/login"
          onClick={onNavigate}
          className={nocturne.sidebarAuthBtn}
          title={isCollapsed ? "Log in" : undefined}
          aria-label={isCollapsed ? "Log in" : undefined}
        >
          <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" className={nocturne.sidebarAuthIcon}>
            <path d="M124,216a12,12,0,0,1-12,12H48a20,20,0,0,1-20-20V48A20,20,0,0,1,48,28h64a12,12,0,0,1,0,24H52V212h60A12,12,0,0,1,124,216Zm112.49-92.49-40-40a12,12,0,0,0-17,17L207,128H100a12,12,0,0,0,0,24H207l-27.51,27.51a12,12,0,0,0,17,17l40-40A12,12,0,0,0,236.49,123.51Z" />
          </svg>
          <span className={nocturne.sidebarAuthLabel}>Log in</span>
        </Link>
        <Link
          href="/register"
          onClick={onNavigate}
          className={nocturne.sidebarAuthBtnPrimary}
          title={isCollapsed ? "Register" : undefined}
          aria-label={isCollapsed ? "Register" : undefined}
        >
          <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" className={nocturne.sidebarAuthIcon}>
            <path d="M256,136a8,8,0,0,1-8,8H232v16a8,8,0,0,1-16,0V144H200a8,8,0,0,1,0-16h16V112a8,8,0,0,1,16,0v16h16A8,8,0,0,1,256,136ZM169.83,157.32a76,76,0,1,0-83.66,0,111.65,111.65,0,0,0-63,46.71,8,8,0,1,0,13.53,8.55,96,96,0,0,1,162.62,0,8,8,0,0,0,13.53-8.55A111.65,111.65,0,0,0,169.83,157.32ZM128,152a60,60,0,1,1,60-60A60.07,60.07,0,0,1,128,152Z" />
          </svg>
          <span className={nocturne.sidebarAuthLabel}>Register</span>
        </Link>
      </div>
      <Link href="/login" onClick={onNavigate} className={nocturne.sidebarGoogleBtn} title={isCollapsed ? "Sign in with Google" : undefined}>
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.73-2.46 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-4v3.11A12 12 0 0 0 12 24Z" />
          <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58v-3.1h-4a12 12 0 0 0 0 10.79l4-3.11Z" />
          <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.1C6.22 6.86 8.87 4.75 12 4.75Z" />
        </svg>
        <span>Sign in with Google</span>
      </Link>
    </>
  );
}
