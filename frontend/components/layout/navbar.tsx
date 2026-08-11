"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { useNav } from "./nav-context";
import styles from "@/components/ui/nocturne.module.css";

export function Navbar() {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapsed } = useNav();

  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ""}`}
      aria-label="Main navigation"
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
          onClick={toggleCollapsed}
          aria-pressed={isCollapsed}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={styles.collapseToggle}
        >
          <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            {isCollapsed ? (
              <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z" />
            ) : (
              <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z" />
            )}
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
              aria-current={isActive ? "page" : undefined}
              title={isCollapsed ? item.label : undefined}
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
          <Link
            href="/login"
            className={styles.sidebarAuthBtn}
            title={isCollapsed ? "Log in" : undefined}
            aria-label={isCollapsed ? "Log in" : undefined}
          >
            <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" className={styles.sidebarAuthIcon}>
              <path d="M124,216a12,12,0,0,1-12,12H48a20,20,0,0,1-20-20V48A20,20,0,0,1,48,28h64a12,12,0,0,1,0,24H52V212h60A12,12,0,0,1,124,216Zm112.49-92.49-40-40a12,12,0,0,0-17,17L207,128H100a12,12,0,0,0,0,24H207l-27.51,27.51a12,12,0,0,0,17,17l40-40A12,12,0,0,0,236.49,123.51Z" />
            </svg>
            <span className={styles.sidebarAuthLabel}>Log in</span>
          </Link>
          <Link
            href="/register"
            className={styles.sidebarAuthBtnPrimary}
            title={isCollapsed ? "Register" : undefined}
            aria-label={isCollapsed ? "Register" : undefined}
          >
            <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" className={styles.sidebarAuthIcon}>
              <path d="M256,136a8,8,0,0,1-8,8H232v16a8,8,0,0,1-16,0V144H200a8,8,0,0,1,0-16h16V112a8,8,0,0,1,16,0v16h16A8,8,0,0,1,256,136ZM169.83,157.32a76,76,0,1,0-83.66,0,111.65,111.65,0,0,0-63,46.71,8,8,0,1,0,13.53,8.55,96,96,0,0,1,162.62,0,8,8,0,0,0,13.53-8.55A111.65,111.65,0,0,0,169.83,157.32ZM128,152a60,60,0,1,1,60-60A60.07,60.07,0,0,1,128,152Z" />
            </svg>
            <span className={styles.sidebarAuthLabel}>Register</span>
          </Link>
        </div>
        <Link href="/login" className={styles.sidebarGoogleBtn} title={isCollapsed ? "Sign in with Google" : undefined}>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.73-2.46 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-4v3.11A12 12 0 0 0 12 24Z" />
            <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58v-3.1h-4a12 12 0 0 0 0 10.79l4-3.11Z" />
            <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.1C6.22 6.86 8.87 4.75 12 4.75Z" />
          </svg>
          <span>Sign in with Google</span>
        </Link>
      </div>
    </aside>
  );
}
