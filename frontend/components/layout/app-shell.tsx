"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { TopNav } from "./top-nav";
import { RouteGuard } from "./route-guard";

// The old Stardust sidebar (navbar.tsx / mobile-topbar.tsx / nav-context.tsx)
// has been retired app-wide per explicit request — every route now uses the
// same shared floating dock-style TopNav (Nocturne) that Home introduced,
// instead of a per-route sidebar. /login and /register stay full-screen
// with no navbar at all, same as before.
const NO_NAV_ROUTES = ["/login", "/register"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideNav = NO_NAV_ROUTES.includes(pathname);

  if (hideNav) {
    return <>{children}</>;
  }

  // Home ("/") renders its own TopNav inline as part of its hero section
  // (see home-hero-demo.tsx) — rendering it again here would duplicate it.
  if (pathname === "/") {
    return <RouteGuard>{children}</RouteGuard>;
  }

  return (
    <>
      <TopNav />
      {/* bg-black here fixes a visible white gap above the navbar: this
          wrapper's own top padding (clearing the fixed/floating TopNav)
          had no background of its own, so the page's default light
          --background token showed through above each page's own dark
          surface. */}
      <div className="min-h-dvh bg-black pt-[88px] sm:pt-[96px]">
        <RouteGuard>{children}</RouteGuard>
      </div>
    </>
  );
}
