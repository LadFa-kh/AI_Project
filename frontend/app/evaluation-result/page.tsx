"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ScoreOverview } from "@/components/result/score-overview";
import { InsightSections } from "@/components/result/insight-sections";
import { SkillSummaryCards } from "@/components/result/skill-summary-cards";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/page-state";
import {
  MOCK_EVALUATION_RESULT,
  type EvaluationResult,
} from "@/lib/result-types";

type Status = "loading" | "empty" | "error" | "success";

export default function EvaluationResultPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [result, setResult] = useState<EvaluationResult | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      // TODO: wire to backend (see PROJECT_CONTEXT.md: POST /assessments response)
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (!MOCK_EVALUATION_RESULT) {
        setStatus("empty");
        return;
      }
      setResult(MOCK_EVALUATION_RESULT);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (status === "loading") {
    return (
      <div className="flex flex-1 bg-zinc-50 px-4 py-12 dark:bg-black">
        <LoadingState message="กำลังโหลดผลประเมิน..." />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-1 bg-zinc-50 px-4 py-12 dark:bg-black">
        <ErrorState
          message="ไม่สามารถโหลดผลประเมินได้ กรุณาลองใหม่อีกครั้ง"
          onRetry={load}
        />
      </div>
    );
  }

  if (status === "empty" || !result) {
    return (
      <div className="flex flex-1 bg-zinc-50 px-4 py-12 dark:bg-black">
        <EmptyState message="ยังไม่มีผลประเมิน กรุณาทำแบบประเมินทักษะก่อน" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 text-center">
          ผลการประเมิน
        </h1>

        <ScoreOverview score={result.overallScore} />
        <SkillSummaryCards skills={result.skillSummary} />
        <InsightSections
          strengths={result.strengths}
          gaps={result.gaps}
          recommendations={result.recommendations}
        />

        <div className="flex flex-col gap-3">
          <Link
            href="/internship-matches"
            className="flex h-11 w-full items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            ดูสถานที่ฝึกงานที่เหมาะสม
          </Link>
          <Link
            href="/skill-assessment"
            className="flex h-11 w-full items-center justify-center rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            กลับไปปรับการประเมิน
          </Link>
        </div>
      </div>
    </div>
  );
}
