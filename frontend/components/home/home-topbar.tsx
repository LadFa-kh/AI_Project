"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "หน้าแรก" },
  { href: "/login", label: "เข้าสู่ระบบ" },
  { href: "/register", label: "สมัครสมาชิก" },
  { href: "/upload-resume", label: "อัปโหลดเรซูเม่" },
  { href: "/skill-assessment", label: "ประเมินทักษะ" },
  { href: "/evaluation-result", label: "ผลประเมิน" },
  { href: "/internship-matches", label: "งานที่เหมาะสม" },
];

export function HomeTopbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-700 bg-slate-900/80 px-4 backdrop-blur">
        <span className="font-heading text-lg font-bold text-slate-100">
          AI_Project
        </span>
        <button
          type="button"
          aria-label={isOpen ? "ปิดเมนู" : "เปิดเมนู"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-200 transition-colors hover:bg-slate-800/60 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {isOpen && (
        <nav className="border-b border-slate-700 bg-slate-900/80 px-3 py-2 backdrop-blur">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={`font-body relative block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${
                  isActive
                    ? "bg-indigo-600/20 pl-4 text-white before:absolute before:inset-y-1 before:left-0 before:w-1 before:rounded-full before:bg-indigo-500 before:content-['']"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
