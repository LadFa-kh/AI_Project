"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "หน้าแรก" },
  { href: "/login", label: "เข้าสู่ระบบ" },
  { href: "/register", label: "สมัครสมาชิก" },
  { href: "/upload-resume", label: "อัปโหลดเรซูเม่" },
  { href: "/skill-assessment", label: "ประเมินทักษะ" },
  { href: "/evaluation-result", label: "ผลประเมิน" },
  { href: "/internship-matches", label: "งานที่เหมาะสม" },
];

export function HomeSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-slate-700 bg-slate-900/60 lg:flex">
      <div className="flex h-16 items-center px-6">
        <span className="font-heading text-lg font-bold text-slate-100">
          AI_Project
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`font-body relative rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${
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
    </aside>
  );
}
