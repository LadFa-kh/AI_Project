"use client";

// Blocks /admin for anyone whose role isn't ADMIN. Layered on top of
// RouteGuard (which only checks isAuthenticated) — RouteGuard already keeps
// unauthenticated users out; this adds the missing role check so a regular
// STUDENT account can't view admin-only stats by navigating to /admin directly.
//
// EMPLOYER has its own separate page instead (/employer/jobs, guarded by
// EmployerGuard) rather than being let in here — see
// components/employer/employer-guard.tsx.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const isAdmin = isAuthenticated && user?.role === "ADMIN";

  useEffect(() => {
    if (isLoading) return;
    if (!isAdmin) router.replace("/");
  }, [isLoading, isAdmin, router]);

  if (isLoading || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
