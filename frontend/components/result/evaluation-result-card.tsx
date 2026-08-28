"use client";

// Full-page structure rebuilt to match the demo
// (seam-demo/evaluation-result.html) — score ring + AI recommendation card
// (typewriter reveal) + missing-skills chips + recommendation list, Nocturne
// palette. Two demo sections were dropped because there's no real data for
// them (confirmed with the user):
//   - per-skill % breakdown bars — the backend only returns one aggregate
//     resumeScore/assessmentScore/finalScore, not per-skill scores
//   - the recommended-companies card grid — that data comes from a
//     different endpoint (/internship-matches), not the assessment-submit
//     response, so this page links out to it instead of faking a preview
//
// Business logic (reading the assessment result from session, score-level
// color/label helpers) is unchanged from the previous single-card layout.

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ScoreBadge } from "@/components/ui/score-badge";
import { InsightChipList } from "@/components/ui/insight-chip-list";
import type { EvaluationResult } from "@/lib/result-types";
import { readAssessmentResult } from "@/lib/assessment-session";
import styles from "./evaluation-result.module.css";
import fieldStyles from "@/components/resume/resume-upload.module.css";

type Status = "loading" | "empty" | "success";

// One-shot character-by-character reveal of the AI recommendation text —
// ported from the demo's typeAiText(). Runs once when `text` first becomes
// available; does not loop (unlike TextType on the Home page), matching the
// demo's "AI is typing this out live" framing for real AI-generated copy.
function useTypewriter(text: string | null) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!text) return;
    // Captured into a local const so TypeScript can narrow it as non-null
    // inside the tick() closure below — `text` itself is a function
    // parameter, and narrowing on those doesn't survive into a nested
    // function declared afterward.
    const value = text;
    let i = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setShown("");
    setDone(false);
    function tick() {
      i++;
      setShown(value.slice(0, i));
      if (i < value.length) {
        timer = setTimeout(tick, 14);
      } else {
        setDone(true);
      }
    }
    timer = setTimeout(tick, 600);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [text]);
  return { shown, done };
}

export function EvaluationResultCard() {
  const [status, setStatus] = useState<Status>("loading");
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const { shown: aiShown, done: aiDone } = useTypewriter(result?.recommendationSummary ?? null);

  const load = useCallback(() => {
    setStatus("loading");
    // Result comes from the skill-assessment step's sessionStorage hand-off
    // (POST /assessments/submit's response) — there's no GET endpoint to
    // re-fetch it, and a resume can only be submitted once.
    const stored = readAssessmentResult();
    if (!stored) {
      setResult(null);
      setStatus("empty");
      return;
    }
    setResult(stored);
    setStatus("success");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (status === "loading") {
    return (
      <div className={fieldStyles.stateBlock}>
        <div className={`${fieldStyles.loadingBlock} ${fieldStyles.animateIn}`}>
          <span className={fieldStyles.loadingSpinner} aria-hidden="true" />
          <p className={fieldStyles.subheading}>กำลังโหลดผลการประเมินของคุณ…</p>
        </div>
      </div>
    );
  }

  if (status === "empty" || !result) {
    return (
      <div className={fieldStyles.stateBlock}>
        <div className={`${fieldStyles.headingBlock} ${fieldStyles.animateIn}`}>
          <h1 className={fieldStyles.heading}>ไม่พบผลการประเมิน</h1>
        </div>
        <p className={`${fieldStyles.formError} ${fieldStyles.animateIn}`} role="alert">
          <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V72a8,8,0,0,1,16,0v64a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z" />
          </svg>
          ยังไม่พบผลการประเมิน — กรุณาทำแบบประเมินทักษะให้เสร็จก่อน
        </p>
        <Link
          href="/skill-assessment"
          className={`${fieldStyles.submitBtn} ${fieldStyles.animateIn} ${fieldStyles.delay1}`}
        >
          ไปหน้าแบบประเมินทักษะ
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.resultWrap}>
      <div className={`${styles.scoreCard} ${styles.animateIn} ${styles.delay1}`}>
        <ScoreBadge score={Math.round(result.finalScore)} />
        <div className={styles.scoreRow}>
          <div className={styles.scoreStat}>
            <span className={styles.scoreStatValue}>{Math.round(result.resumeScore)}</span>
            <span className={styles.scoreStatLabel}>คะแนนเรซูเม่</span>
          </div>
          <div className={styles.scoreStat}>
            <span className={styles.scoreStatValue}>{Math.round(result.assessmentScore)}</span>
            <span className={styles.scoreStatLabel}>คะแนนแบบประเมิน</span>
          </div>
        </div>
      </div>

      {result.recommendationSummary && (
        <div className={`${styles.aiCard} ${styles.animateIn} ${styles.delay2}`}>
          <div className={styles.aiCardHeader}>
            <span className={styles.aiSparkle} aria-hidden="true">✦</span>
            <span className={styles.aiCardTitle}>คำแนะนำจาก AI</span>
            <span className={styles.aiCardBadge}>สร้างโดย AI</span>
          </div>
          <p className={styles.aiCardText}>
            {aiShown}
            {!aiDone && <span className={styles.aiCursor} aria-hidden="true" />}
          </p>
          {result.recommendationItems.length > 0 && aiDone && (
            <ul className={`${styles.recommendationList} ${styles.animateIn}`}>
              {result.recommendationItems.map((item, index) => (
                <li key={index} className={styles.recommendationItem}>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {result.missingSkills.length > 0 && (
        <div className={`${styles.sectionBlock} ${styles.animateIn} ${styles.delay3}`}>
          <InsightChipList heading="ทักษะที่ยังขาด" items={result.missingSkills} tone="warning" />
        </div>
      )}

      <div className={`${styles.ctaRow} ${styles.animateIn} ${styles.delay4}`}>
        <Link href="/internship-matches" className={styles.btnPrimary}>
          ดูตำแหน่งฝึกงานที่แนะนำ
        </Link>
        {/* "ประเมินใหม่อีกครั้ง" in the demo isn't accurate here — a resume
            can only be submitted for assessment once (backend rejects
            resubmission), so the real equivalent is starting over with a
            new resume upload. */}
        <Link href="/upload-resume" className={styles.btnGhost}>
          อัปโหลดเรซูเม่ใหม่
        </Link>
      </div>
    </div>
  );
}
