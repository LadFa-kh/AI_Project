"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StepIndicator } from "@/components/ui/step-indicator";
import { ScoreBadge } from "@/components/ui/score-badge";
import { InsightChipList } from "@/components/ui/insight-chip-list";
import { MOCK_EVALUATION_RESULT, type EvaluationResult } from "@/lib/result-types";
import nocturne from "@/components/ui/nocturne.module.css";
import styles from "./evaluation-result.module.css";

type Status = "loading" | "error" | "success";

export function EvaluationResultCard() {
  const [status, setStatus] = useState<Status>("loading");
  const [result, setResult] = useState<EvaluationResult | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      // TODO: wire to backend — GET response per PROJECT_CONTEXT.md
      // -> { assessmentId, overallScore, recommendations, strengths, gaps }
      await new Promise<EvaluationResult>((resolve, reject) =>
        setTimeout(() => resolve(MOCK_EVALUATION_RESULT), 900)
      );
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
      <div className={`${nocturne.card} ${styles.cardWide}`}>
        <StepIndicator currentStep={3} totalSteps={3} label="Your results" />
        <div className={styles.loadingBlock}>
          <span className={nocturne.spinner} style={{ width: 28, height: 28, borderColor: "rgba(229,224,255,0.2)", borderTopColor: "#FC8337" }} aria-hidden="true" />
          <p className={nocturne.subheading}>Generating your evaluation…</p>
        </div>
      </div>
    );
  }

  if (status === "error" || !result) {
    return (
      <div className={`${nocturne.card} ${styles.cardWide}`}>
        <StepIndicator currentStep={3} totalSteps={3} label="Your results" />
        <div className={nocturne.headingBlock}>
          <h1 className={nocturne.heading}>Your evaluation is ready</h1>
        </div>
        <p className={nocturne.formError} role="alert">
          <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V72a8,8,0,0,1,16,0v64a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z" />
          </svg>
          We couldn&apos;t generate your evaluation. Please try again.
        </p>
        <button type="button" onClick={load} className={nocturne.submitBtn}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`${nocturne.card} ${styles.cardWide}`}>
      <StepIndicator currentStep={3} totalSteps={3} label="Your results" />

      <div className={nocturne.headingBlock}>
        <h1 className={nocturne.heading}>Your evaluation is ready</h1>
      </div>

      <ScoreBadge score={result.overallScore} />

      <InsightChipList heading="Strengths" items={result.strengths} tone="positive" />
      <InsightChipList heading="Areas to grow" items={result.gaps} tone="warning" />

      <div>
        <h2 className={nocturne.sectionHeading}>Recommendations</h2>
        <ul className={nocturne.recommendationList}>
          {result.recommendations.map((rec) => (
            <li key={rec} className={nocturne.recommendationItem}>
              <svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                <path d="M228.92,49.69a8,8,0,0,0-6.86-1.45L40.86,90.62a13.4,13.4,0,0,0-4.13,24.05l68.94,32.85,32.85,68.94a13.4,13.4,0,0,0,24.05-4.13l42.38-181.2A8,8,0,0,0,228.92,49.69Z" />
              </svg>
              {rec}
            </li>
          ))}
        </ul>
      </div>

      <Link href="/internship-matches" className={nocturne.submitBtn}>
        View internship matches
      </Link>
    </div>
  );
}
