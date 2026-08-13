"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { useNav } from "./nav-context";
import { AuthStatus } from "./auth-status";
import { ProcessStepper } from "./process-stepper";
import { useAuth } from "@/lib/auth-context";
import styles from "@/components/ui/nocturne.module.css";

export function MobileTopbar() {
  const pathname = usePathname();
  const { isDrawerOpen, openDrawer, closeDrawer } = useNav();
  const { user } = useAuth();
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === "ADMIN");

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
              {visibleNavItems.map((item) => {
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
              <ProcessStepper />
            </nav>

            <div className={styles.sidebarFooter}>
              <AuthStatus onNavigate={closeDrawer} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
