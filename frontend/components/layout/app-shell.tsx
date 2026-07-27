"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { NavProvider } from "./nav-context";
import { Navbar } from "./navbar";
import { MobileTopbar } from "./mobile-topbar";
import styles from "@/components/ui/nocturne.module.css";

// /login and /register stay full-screen per spec. Home ("/") now shares the same
// AppShell/Navbar as the rest of the app (merged from its own separate sidebar).
const NO_NAV_ROUTES = ["/login", "/register"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideNav = NO_NAV_ROUTES.includes(pathname);

  if (hideNav) {
    return <>{children}</>;
  }

  return (
    <NavProvider>
      <div className={styles.appShell}>
        <Navbar />
        <div className={styles.appContent}>
          <MobileTopbar />
          {children}
        </div>
      </div>
    </NavProvider>
  );
}
