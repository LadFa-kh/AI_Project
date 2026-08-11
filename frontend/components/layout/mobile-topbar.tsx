"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { useNav } from "./nav-context";
import styles from "@/components/ui/nocturne.module.css";

export function MobileTopbar() {
  const pathname = usePathname();
  const { isDrawerOpen, openDrawer, closeDrawer } = useNav();

  return (
    <>
      <header className={styles.mobileTopbar}>
        <div className={styles.mobileTopbarLogo}>
          <span className={styles.sidebarLogoMark} aria-hidden="true" style={{ width: 28, height: 28 }}>
            <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor">
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z" />
            </svg>
          </span>
          AI_Project
        </div>
        <button
          type="button"
          onClick={openDrawer}
          aria-label="Open navigation menu"
          aria-expanded={isDrawerOpen}
          className={styles.hamburgerBtn}
        >
          <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z" />
          </svg>
        </button>
      </header>

      {isDrawerOpen && (
        <>
          <div
            className={styles.drawerOverlay}
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <div
            className={styles.drawerPanel}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className={styles.sidebarHeader}>
              <div className={styles.sidebarLogo}>
                <span className={styles.sidebarLogoMark} aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z" />
                  </svg>
                </span>
                <span>AI_Project</span>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close navigation menu"
                className={styles.collapseToggle}
              >
                <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                  <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
                </svg>
              </button>
            </div>
            <nav className={styles.sidebarNav}>
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeDrawer}
                    aria-current={isActive ? "page" : undefined}
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                  >
                    <span className={styles.navItemIcon}>{item.icon}</span>
                    <span className={styles.navItemLabel}>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className={styles.sidebarFooter}>
              <div className={styles.sidebarFooterRow}>
                <Link href="/login" className={styles.sidebarAuthBtn} onClick={closeDrawer}>
                  <span className={styles.sidebarAuthLabel}>Log in</span>
                </Link>
                <Link href="/register" className={styles.sidebarAuthBtnPrimary} onClick={closeDrawer}>
                  <span className={styles.sidebarAuthLabel}>Register</span>
                </Link>
              </div>
              <Link href="/login" className={styles.sidebarGoogleBtn} onClick={closeDrawer}>
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.73-2.46 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-4v3.11A12 12 0 0 0 12 24Z" />
                  <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58v-3.1h-4a12 12 0 0 0 0 10.79l4-3.11Z" />
                  <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.1C6.22 6.86 8.87 4.75 12 4.75Z" />
                </svg>
                <span>Sign in with Google</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
