"use client";

// Blocks /employer/jobs for anyone whose role isn't EMPLOYER. Same pattern
// as components/admin/admin-guard.tsx — layered on top of RouteGuard
// (which only checks isAuthenticated); this adds the missing role check so
// a STUDENT/ADMIN account can't land on the employer job-posting page by
// navigating there directly.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function EmployerGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const isEmployer = isAuthenticated && user?.role === "EMPLOYER";

  useEffect(() => {
    if (isLoading) return;
    if (!isEmployer) router.replace("/");
  }, [isLoading, isEmployer, router]);

  if (isLoading || !isEmployer) {
    return null;
  }

  return <>{children}</>;
}
