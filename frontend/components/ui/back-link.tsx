"use client";

// "ย้อนกลับ" that returns to wherever the user came from (job board, company
// page, admin, matches…) instead of always jumping to one fixed list.
// Falls back to `fallbackHref` when there's no in-app history (opened directly).

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function BackLink({
  fallbackHref,
  className,
  children,
}: {
  fallbackHref: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <a
      href={fallbackHref}
      className={className}
      onClick={(e) => {
        if (window.history.length > 1 && document.referrer.startsWith(window.location.origin)) {
          e.preventDefault();
          router.back();
        }
      }}
    >
      {children}
    </a>
  );
}
