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
import type { ScoreBreakdown } from "@/lib/assessment-service";
import { readAssessmentResult } from "@/lib/assessment-session";
import styles from "./evaluation-result.module.css";
import fieldStyles from "@/components/resume/resume-upload.module.css";

type Status = "loading" | "empty" | "success";

// "ที่มาของคะแนน" — collapsible breakdown of exactly how resumeScore/
// assessmentScore/finalScore were computed, per API_CHANGES.md §1. Every
// number rendered here is read straight from `breakdown` rather than
// recomputed (caveat #1 in the doc): if the backend's weighting or penalty
// table ever changes, this section updates itself with no code change.
function ScoreBreakdownSection({
  breakdown,
  explanation,
}: {
  breakdown: ScoreBreakdown;
  explanation?: string;
}) {
  const noStandardSkills = breakdown.totalStandardSkills === 0;
  const hasPenalty = breakdown.penaltyFactor < 1;

  return (
    <details className={`${styles.breakdownBlock} ${styles.animateIn} ${styles.delay3}`}>
      <summary className={styles.breakdownToggle}>
        ที่มาของคะแนน
        <svg
          className={styles.breakdownChevron}
          width="16"
          height="16"
          viewBox="0 0 256 256"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z" />
        </svg>
      </summary>

      <div className={styles.breakdownBody}>
        {explanation && <p className={styles.breakdownExplanation}>{explanation}</p>}

        {breakdown.roleUsedForMatching && (
          <p className={styles.breakdownRow} style={{ margin: 0 }}>
            เทียบทักษะกับตำแหน่ง <strong>{breakdown.roleUsedForMatching}</strong>
            {breakdown.roleInferredByAi && " (AI วิเคราะห์ให้จากทักษะที่พบ ไม่ได้ระบุตำแหน่งเอง)"}
          </p>
        )}

        {/* คะแนนเรซูเม่ */}
        <div className={styles.breakdownSection}>
          <h3 className={styles.breakdownSectionTitle}>คะแนนเรซูเม่ (น้ำหนัก {breakdown.resumeWeight * 100}%)</h3>

          {noStandardSkills ? (
            <div className={styles.breakdownWarning} role="alert">
              <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V72a8,8,0,0,1,16,0v64a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z" />
              </svg>
              <span>
                ระบบไม่พบทักษะมาตรฐานของตำแหน่ง &ldquo;{breakdown.roleUsedForMatching}&rdquo; ในฐานข้อมูล จึงเทียบคะแนนให้ไม่ได้
                (ไม่ใช่ว่าทักษะของคุณไม่ตรง) — ลองระบุชื่อตำแหน่งงานที่ใกล้เคียงกับชื่ออาชีพมาตรฐานมากขึ้น
              </span>
            </div>
          ) : (
            <>
              <div className={styles.breakdownRow}>
                <span>ทักษะที่สกัดจากเรซูเม่ทั้งหมด</span>
                <strong>{breakdown.totalResumeSkills}</strong>
              </div>
              <div className={`${styles.breakdownRow} ${styles.breakdownRowStart}`}>
                <span>
                  ทักษะมาตรฐานของตำแหน่งนี้
                  <br />
                  <span className={styles.breakdownHint}>
                    จากฐานข้อมูลทักษะมาตรฐาน O*NET ทั้งหมดที่เกี่ยวข้องกับชื่อตำแหน่ง &ldquo;
                    {breakdown.roleUsedForMatching}&rdquo; — ใช้เป็นเกณฑ์เทียบเท่านั้น ไม่ใช่รายการที่ต้องมีให้ครบ
                  </span>
                </span>
                <strong>{breakdown.totalStandardSkills}</strong>
              </div>
              <div className={`${styles.breakdownRow} ${styles.breakdownRowStart}`}>
                <span>
                  จับคู่ได้
                  <br />
                  <span className={styles.breakdownHint}>
                    ทักษะจากเรซูเม่ของคุณที่ตรงกับรายการทักษะมาตรฐานด้านบน (แสดงรายชื่อด้านล่าง)
                  </span>
                </span>
                <strong>{breakdown.matchedSkills.length} รายการ</strong>
              </div>
              <p className={styles.breakdownFormula}>
                precisionScore = ({breakdown.matchedSkills.length} / {breakdown.totalResumeSkills}) × 100 ={" "}
                {breakdown.precisionScore.toFixed(2)}
              </p>
              <p className={styles.breakdownReason} style={{ marginTop: 0 }}>
                หมายเหตุ: ตัวหารของสูตรนี้คือจำนวนทักษะทั้งหมดในเรซูเม่ ({breakdown.totalResumeSkills}) ไม่ใช่จำนวนทักษะมาตรฐาน
                ({breakdown.totalStandardSkills}) — ยิ่งใส่ทักษะในเรซูเม่เยอะแต่ไม่ตรงสาย คะแนนส่วนนี้ยิ่งลดลง
              </p>
              {hasPenalty && (
                <p className={styles.breakdownFormula}>
                  resumeScore = {breakdown.precisionScore.toFixed(2)} × {breakdown.penaltyFactor.toFixed(1)} (ตัวคูณลงโทษ) ={" "}
                  {breakdown.resumeScore.toFixed(2)}
                </p>
              )}
              {breakdown.resumeScoreReason && (
                <p className={styles.breakdownReason}>{breakdown.resumeScoreReason}</p>
              )}
              {(breakdown.matchedSkills.length > 0 || breakdown.unmatchedSkills.length > 0) && (
                <div style={{ marginTop: 10 }}>
                  {breakdown.matchedSkills.length > 0 && (
                    <InsightChipList heading="ทักษะที่ตรงกับตำแหน่ง" items={breakdown.matchedSkills} tone="positive" />
                  )}
                  {breakdown.unmatchedSkills.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <InsightChipList heading="ทักษะในเรซูเม่ที่ไม่ตรงกับตำแหน่งนี้" items={breakdown.unmatchedSkills} tone="warning" />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <hr className={styles.breakdownDivider} />

        {/* คะแนนแบบประเมินตนเอง */}
        <div className={styles.breakdownSection}>
          <h3 className={styles.breakdownSectionTitle}>
            คะแนนแบบประเมินตนเอง (น้ำหนัก {breakdown.assessmentWeight * 100}%)
          </h3>
          <div className={styles.breakdownRow}>
            <span>ตอบไป {breakdown.answeredQuestions} ข้อ (ข้อละสูงสุด {breakdown.maxScorePerQuestion} คะแนน)</span>
          </div>
          <p className={styles.breakdownFormula}>
            assessmentScore = ({breakdown.totalScoreObtained} / {breakdown.maxPossibleScore}) × 100 ={" "}
            {breakdown.assessmentScore.toFixed(2)}
          </p>
        </div>

        <hr className={styles.breakdownDivider} />

        {/* รวมคะแนน */}
        <div className={styles.breakdownSection}>
          <h3 className={styles.breakdownSectionTitle}>คะแนนรวม</h3>
          <div className={styles.breakdownRow}>
            <span>
              คะแนนเรซูเม่ {breakdown.resumeScore.toFixed(2)} × {breakdown.resumeWeight * 100}%
            </span>
            <strong>{breakdown.resumeContribution.toFixed(2)}</strong>
          </div>
          <div className={styles.breakdownRow}>
            <span>
              คะแนนแบบประเมิน {breakdown.assessmentScore.toFixed(2)} × {breakdown.assessmentWeight * 100}%
            </span>
            <strong>{breakdown.assessmentContribution.toFixed(2)}</strong>
          </div>
          <p className={styles.breakdownFormula}>
            finalScore = {breakdown.resumeContribution.toFixed(2)} + {breakdown.assessmentContribution.toFixed(2)} ={" "}
            {breakdown.finalScore.toFixed(2)}
          </p>
        </div>
      </div>
    </details>
  );
}

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

      {result.scoreBreakdown && (
        <ScoreBreakdownSection breakdown={result.scoreBreakdown} explanation={result.scoreExplanation} />
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
