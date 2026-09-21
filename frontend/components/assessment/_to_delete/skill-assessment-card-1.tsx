"use client";

// Stepper UX — ported from the React Bits "Stepper" component demo
// (seam-demo/skill-assessment-stepper.html): one question per step, circle
// indicators + fill-connectors above, slide transition between steps,
// Back/Next footer, click-to-jump on already-answered steps. Unlike the
// demo (which hardcoded 5 questions with a fixed 1-5 numeric scale), real
// questions come from the backend as a dynamic-length list of
// { id, question, options[] } — option count/labels are whatever the
// backend sends (e.g. "1. พอใช้"), so the per-step option grid renders
// `options` directly instead of a fixed 5-slot slider.
//
// Business logic (question source, answer state, submit API call, error
// handling, session hand-off to /evaluation-result) is 100% unchanged from
// the previous single-page-of-questions layout — only the step-by-step
// presentation is new.
//
// desiredRoleName: per explicit confirmation, this page does NOT re-ask for
// it — it's read once from the upload-resume session hand-off (optional
// there) and submitted as-is, even if empty. The backend team confirmed an
// empty desiredRoleName is acceptable; if that changes, describeSubmitError
// below already surfaces the backend's own message for it.

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { readResumeUploadResult } from "@/lib/resume-session";
import { submitAssessment } from "@/lib/assessment-service";
import { writeAssessmentResult } from "@/lib/assessment-session";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api-client";
import type { AssessmentAnswers, AssessmentQuestion } from "@/lib/assessment-types";
import styles from "./skill-assessment.module.css";
import fieldStyles from "@/components/resume/resume-upload.module.css";

function describeSubmitError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.message.includes("ทำแบบประเมินไปแล้ว")) {
      return "เรซูเม่นี้ทำแบบประเมินไปแล้ว ไม่สามารถส่งซ้ำได้";
    }
    if (err.message.includes("ตำแหน่งงานที่ต้องการ")) {
      return "กรุณาระบุตำแหน่งงานที่ต้องการก่อนส่งแบบประเมิน";
    }
    return err.message;
  }
  return err instanceof Error ? err.message : "ส่งแบบประเมินไม่สำเร็จ กรุณาลองใหม่";
}

type Status = "default" | "loading" | "error" | "success";
type Direction = "next" | "prev";

export function SkillAssessmentCard() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<AssessmentQuestion[] | null>(null);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [desiredRoleName, setDesiredRoleName] = useState("");
  const [status, setStatus] = useState<Status>("default");
  const [formError, setFormError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<Direction>("next");

  const contentWrapRef = useRef<HTMLDivElement>(null);
  const contentInnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = readResumeUploadResult();
    setQuestions(stored?.questions ?? []);
    setResumeId(stored?.resumeId ?? null);
    setDesiredRoleName(stored?.desiredRoleName ?? "");
  }, []);

  const total = questions?.length ?? 0;
  const isReviewStep = questions !== null && total > 0 && stepIndex === total;
  const currentQuestion = questions && stepIndex < total ? questions[stepIndex] : null;
  const answeredCount = Object.keys(answers).length;
  const isComplete = questions !== null && total > 0 && answeredCount === total;
  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const canSubmit = isComplete && !isLoading && !!user && !!resumeId;

  // Height-animate the step content wrapper to the active step's measured
  // height, same idea as the real Stepper's StepContentWrapper
  // (useLayoutEffect + offsetHeight) — steps with different content
  // lengths animate smoothly instead of jumping.
  useLayoutEffect(() => {
    const wrap = contentWrapRef.current;
    const inner = contentInnerRef.current;
    if (!wrap || !inner) return;
    wrap.style.height = `${inner.offsetHeight}px`;
  }, [stepIndex, isReviewStep, questions]);

  function goToStep(next: number, dir: Direction) {
    setDirection(dir);
    setStepIndex(next);
  }

  function handleSelect(option: string) {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));
    setFormError(null);
  }

  function handleNext() {
    if (!currentQuestion || !answers[currentQuestion.id]) return;
    goToStep(stepIndex + 1, "next");
  }

  function handleBack() {
    if (stepIndex === 0) return;
    goToStep(stepIndex - 1, "prev");
  }

  function handleJump(target: number) {
    if (target === stepIndex) return;
    if (target > stepIndex) return; // no skipping ahead of unanswered steps
    goToStep(target, "prev");
  }

  async function handleSubmit() {
    if (!isComplete) return;
    if (!user || !resumeId || questions === null) {
      setFormError("ไม่พบข้อมูลเรซูเม่ กรุณาอัปโหลดเรซูเม่ใหม่อีกครั้ง");
      return;
    }
    setStatus("loading");
    setFormError(null);
    try {
      const result = await submitAssessment(
        resumeId,
        desiredRoleName.trim(),
        questions,
        answers
      );
      writeAssessmentResult(result);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setFormError(describeSubmitError(err));
    }
  }

  // ===== Loading (initial) — reading the upload-resume session hand-off =====
  if (questions === null) {
    return (
      <div className={fieldStyles.stateBlock}>
        <div className={`${fieldStyles.loadingBlock} ${fieldStyles.animateIn}`}>
          <span className={fieldStyles.loadingSpinner} aria-hidden="true" />
        </div>
      </div>
    );
  }

  // ===== No questions — resume hasn't been uploaded yet in this session =====
  if (questions.length === 0) {
    return (
      <div className={fieldStyles.stateBlock}>
        <div className={`${fieldStyles.headingBlock} ${fieldStyles.animateIn}`}>
          <h1 className={fieldStyles.heading}>ไม่พบคำถามประเมิน</h1>
          <p className={fieldStyles.subheading}>
            กรุณาอัปโหลดเรซูเม่ของคุณก่อน เราจะสร้างคำถามเหล่านี้จากเรซูเม่ของคุณ
          </p>
        </div>
        <Link
          href="/upload-resume"
          className={`${fieldStyles.submitBtn} ${fieldStyles.animateIn} ${fieldStyles.delay1}`}
        >
          ไปอัปโหลดเรซูเม่
        </Link>
      </div>
    );
  }

  // ===== Submitting =====
  if (isLoading) {
    return (
      <div className={fieldStyles.stateBlock}>
        <div className={`${fieldStyles.loadingBlock} ${fieldStyles.animateIn}`}>
          <span className={fieldStyles.loadingSpinner} aria-hidden="true" />
          <p className={fieldStyles.subheading}>กำลังส่งแบบประเมินของคุณ…</p>
        </div>
      </div>
    );
  }

  // ===== Submitted successfully =====
  if (isSuccess) {
    return (
      <div className={fieldStyles.stateBlock}>
        <div className={`${fieldStyles.successBlock} ${fieldStyles.animateIn}`}>
          <span className={fieldStyles.successIcon} aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 256 256" fill="currentColor">
              <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
            </svg>
          </span>
          <h1 className={fieldStyles.heading}>ส่งแบบประเมินสำเร็จ</h1>
          <p className={fieldStyles.subheading}>ขอบคุณ เราได้บันทึกระดับทักษะของคุณเรียบร้อยแล้ว</p>
        </div>
        <Link
          href="/evaluation-result"
          className={`${fieldStyles.submitBtn} ${fieldStyles.animateIn} ${fieldStyles.delay1}`}
        >
          ดูผลการประเมินของคุณ
        </Link>
      </div>
    );
  }

  // ===== Stepper — one question per step =====
  return (
    <div className={`${styles.stepperCard} ${styles.animateIn} ${styles.delay1}`}>
      <div className={styles.stepIndicators}>
        {questions.map((q, i) => {
          const isActive = !isReviewStep && i === stepIndex;
          const isDone = isReviewStep || i < stepIndex;
          const isLocked = i > stepIndex;
          return (
            <div key={q.id} style={{ display: "contents" }}>
              <div
                role="button"
                tabIndex={isLocked ? -1 : 0}
                aria-current={isActive ? "step" : undefined}
                aria-label={`คำถามที่ ${i + 1}`}
                className={`${styles.stepCircleWrap} ${isActive ? styles.stepCircleActive : ""} ${
                  isDone ? styles.stepCircleComplete : ""
                } ${isLocked ? styles.stepCircleLocked : ""}`}
                onClick={() => handleJump(i)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && !isLocked) {
                    e.preventDefault();
                    handleJump(i);
                  }
                }}
              >
                <span className={styles.stepCircle}>
                  {isDone ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : isActive ? (
                    <span className={styles.stepCircleDot} />
                  ) : (
                    i + 1
                  )}
                </span>
              </div>
              {i < questions.length - 1 && (
                <div className={styles.stepConnector}>
                  <div
                    className={styles.stepConnectorFill}
                    style={{ width: (isReviewStep || i < stepIndex) ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {formError && (
        <p className={`${styles.formError} ${fieldStyles.animateIn}`} role="alert">
          <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V72a8,8,0,0,1,16,0v64a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z" />
          </svg>
          {formError}
        </p>
      )}

      <div className={styles.stepContentWrap} ref={contentWrapRef}>
        <div
          key={isReviewStep ? "review" : stepIndex}
          ref={contentInnerRef}
          className={`${styles.stepContent} ${direction === "next" ? styles.enterNext : styles.enterPrev}`}
        >
          {isReviewStep ? (
            <div className={styles.reviewBlock}>
              <div className={styles.completeIcon} aria-hidden="true">✓</div>
              <p className={styles.completeTitle}>ประเมินครบทุกข้อแล้ว</p>
              <p className={styles.completeSub}>ตรวจสอบคำตอบของคุณอีกครั้ง หรือกดส่งแบบประเมินได้เลย</p>
              <div className={styles.footerRow} style={{ justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={handleBack}
                  className={styles.navBtnPrev}
                >
                  ← ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={styles.navBtnNext}
                >
                  ส่งแบบประเมิน
                </button>
              </div>
            </div>
          ) : currentQuestion ? (
            <>
              <div className={styles.questionNumber}>
                <span className={styles.questionDotTag} aria-hidden="true" />
                <span>คำถามที่ {stepIndex + 1} / {total}</span>
              </div>
              <p className={styles.questionText}>{currentQuestion.question}</p>
              <p className={styles.questionHint}>เลือกตัวเลือกที่ตรงกับความสามารถของคุณ</p>

              <div
                role="radiogroup"
                aria-label={`คำตอบสำหรับคำถาม ${currentQuestion.id}`}
                className={styles.levelSelector}
              >
                {currentQuestion.options.map((option) => {
                  const isSelected = answers[currentQuestion.id] === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleSelect(option)}
                      className={`${styles.levelBtn} ${isSelected ? styles.levelBtnActive : ""}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {/* Legend per อาจารย์'s note — explains what each of the 4
                  levels generally means, since the option text itself
                  (e.g. "1. พอใช้") doesn't spell out the criteria. Placed
                  below the options (per feedback) as reference material
                  rather than something to read before picking. */}
              <div className={styles.scaleLegend}>
                <p className={styles.scaleLegendHeading}>
                  <span className={styles.questionDotTag} aria-hidden="true" />
                  ความหมายของแต่ละระดับ
                </p>
                <div className={styles.scaleLegendList}>
                  <div className={styles.scaleLegendRow}>
                    <span className={styles.scaleLegendLabel}>พอใช้</span>
                    <span>พอมีพื้นฐาน เคยลองทำหรือเรียนรู้มาบ้าง แต่ยังไม่คล่องหรือไม่มั่นใจนัก</span>
                  </div>
                  <div className={styles.scaleLegendRow}>
                    <span className={styles.scaleLegendLabel}>มาตรฐาน</span>
                    <span>ทำได้ในระดับทั่วไปตามที่คาดหวังจากผู้เริ่มต้นทำงานจริง</span>
                  </div>
                  <div className={styles.scaleLegendRow}>
                    <span className={styles.scaleLegendLabel}>ดี</span>
                    <span>คุ้นเคยและใช้งานได้อย่างมั่นใจ มีประสบการณ์ลงมือทำมาพอสมควร</span>
                  </div>
                  <div className={styles.scaleLegendRow}>
                    <span className={styles.scaleLegendLabel}>ดีมาก</span>
                    <span>เชี่ยวชาญ สามารถแก้ปัญหาที่ซับซ้อนหรือสอนผู้อื่นในเรื่องนี้ได้</span>
                  </div>
                </div>
              </div>

              <div className={`${styles.footerRow} ${stepIndex === 0 ? styles.footerRowOnlyNext : ""}`}>
                {stepIndex !== 0 && (
                  <button type="button" onClick={handleBack} className={styles.navBtnPrev}>
                    ← ย้อนกลับ
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!answers[currentQuestion.id]}
                  className={styles.navBtnNext}
                >
                  {stepIndex === total - 1 ? "เสร็จสิ้น" : "ถัดไป →"}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
