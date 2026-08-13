"use client";

// Blocks every route except "/" until the user is authenticated. Redirects
// to /login (which is exempt via AppShell's NO_NAV_ROUTES, so no loop).
// Waits for auth-context's initial localStorage hydration (isLoading) before
// deciding, so a logged-in user isn't bounced to /login on a hard refresh.

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const PUBLIC_ROUTES = ["/"];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (isLoading || isPublic || isAuthenticated) return;
    router.replace("/login");
  }, [isLoading, isPublic, isAuthenticated, router]);

  // While hydrating or about to redirect an unauthenticated user off a
  // protected route, render nothing to avoid a flash of protected content.
  if (!isPublic && (isLoading || !isAuthenticated)) {
    return null;
  }

  return <>{children}</>;
}
