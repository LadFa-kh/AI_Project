"use client";

import { useNav } from "@/components/layout/nav-context";

export function FooterSection() {
  const { isCollapsed } = useNav();

  return (
    <footer
      className={`fixed inset-x-0 bottom-0 z-10 flex h-10 items-center border-t border-home-border bg-home-bg px-4 transition-[left] duration-150 md:px-6 lg:px-8 ${
        isCollapsed ? "min-[769px]:left-[76px]" : "min-[769px]:left-[240px]"
      }`}
    >
      <div className="mx-auto w-full max-w-6xl text-center">
        <p className="font-body text-xs text-home-text-secondary md:text-sm">
          © {new Date().getFullYear()} AI_Project. สงวนลิขสิทธิ์.
        </p>
      </div>
    </footer>
  );
}
