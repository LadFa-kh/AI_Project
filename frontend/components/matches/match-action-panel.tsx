"use client";

import Link from "next/link";
import { useState } from "react";
import type { InternshipDetail } from "@/lib/match-detail-types";

type MatchActionPanelProps = {
  detail: InternshipDetail;
};

type ApplyStatus = "default" | "loading" | "success" | "error";

export function MatchActionPanel({ detail }: MatchActionPanelProps) {
  const [status, setStatus] = useState<ApplyStatus>("default");

  async function handleApply() {
    setStatus("loading");
    try {
      // TODO: wire to backend apply endpoint (see contract checklist)
      await new Promise((resolve) => setTimeout(resolve, 800));
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="rounded-lg border border-zinc-300 p-4 dark:border-zinc-700">
      <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        เตรียมตัวก่อนสมัคร
      </h2>

      <div className="mt-3">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          เอกสารที่ควรเตรียม
        </p>
        <ul className="mt-1 flex flex-col gap-1">
          {detail.recommendedDocuments.map((doc) => (
            <li key={doc} className="text-sm text-zinc-600 dark:text-zinc-400">
              • {doc}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          ทักษะที่ควรอัปก่อนสมัคร
        </p>
        <ul className="mt-1 flex flex-col gap-1">
          {detail.skillsToImprove.length === 0 ? (
            <li className="text-sm text-zinc-600 dark:text-zinc-400">ไม่มี</li>
          ) : (
            detail.skillsToImprove.map((skill) => (
              <li key={skill} className="text-sm text-zinc-600 dark:text-zinc-400">
                • {skill}
              </li>
            ))
          )}
        </ul>
      </div>

      {status === "error" && (
        <p role="alert" className="mt-3 text-xs text-red-600 dark:text-red-400">
          สมัครไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
        </p>
      )}

      {status === "success" ? (
        <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          ส่งใบสมัครเรียบร้อยแล้ว
        </p>
      ) : (
        <button
          type="button"
          onClick={handleApply}
          disabled={status === "loading"}
          className="mt-4 h-11 w-full rounded-lg bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {status === "loading" ? "กำลังส่งใบสมัคร..." : "สมัครฝึกงานตำแหน่งนี้"}
        </button>
      )}

      <Link
        href="/internship-matches"
        className="mt-3 flex h-11 w-full items-center justify-center rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        กลับไปหน้ารายการ
      </Link>
    </div>
  );
}
