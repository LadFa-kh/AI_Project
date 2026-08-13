"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { useNav } from "./nav-context";
import { AuthStatus } from "./auth-status";
import { ProcessStepper } from "./process-stepper";
import { useAuth } from "@/lib/auth-context";
import styles from "@/components/ui/nocturne.module.css";

export function Navbar() {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapsed } = useNav();
  const { user } = useAuth();
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === "ADMIN");

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
        {visibleNavItems.map((item) => {
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
        <ProcessStepper />
      </nav>

      <div className={styles.sidebarFooter}>
        <AuthStatus isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
}
