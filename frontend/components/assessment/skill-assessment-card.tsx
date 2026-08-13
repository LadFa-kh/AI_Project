"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StepIndicator } from "@/components/ui/step-indicator";
import { SkillLevelGroup } from "./skill-level-group";
import type { AssessmentAnswers, AssessmentQuestion } from "@/lib/assessment-types";
import { readResumeUploadResult } from "@/lib/resume-session";
import styles from "./skill-assessment.module.css";

type Status = "default" | "loading" | "error" | "success";

export function SkillAssessmentCard() {
  const [questions, setQuestions] = useState<AssessmentQuestion[] | null>(null);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [status, setStatus] = useState<Status>("default");
  const [formError, setFormError] = useState<string | null>(null);

  // Questions come from the upload-resume step's sessionStorage hand-off —
  // there's no API to fetch them independently.
  useEffect(() => {
    const stored = readResumeUploadResult();
    setQuestions(stored?.questions ?? []);
  }, []);

  const answeredCount = Object.keys(answers).length;
  const isComplete = questions !== null && questions.length > 0 && answeredCount === questions.length;
  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const canSubmit = isComplete && !isLoading;

  function handleSelect(questionId: string, option: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
    setFormError(null);
  }

  async function handleSubmit() {
    if (!isComplete) return;
    setStatus("loading");
    setFormError(null);
    try {
      // No backend "submit assessment" endpoint exists yet — answers stay
      // client-side for now. Simulate a brief delay for UX consistency.
      await new Promise((resolve) => setTimeout(resolve, 400));
      setStatus("success");
    } catch {
      setStatus("error");
      setFormError("Couldn't submit your assessment. Please try again.");
    }
  }

  if (questions === null) {
    return (
      <div className={styles.card}>
        <div className={`${styles.animateIn} ${styles.delay1}`}>
          <StepIndicator currentStep={2} totalSteps={3} label="Skill assessment" />
        </div>
        <div className={`${styles.loadingBlock} ${styles.animateIn} ${styles.delay2}`}>
          <span className={styles.loadingSpinner} aria-hidden="true" />
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className={styles.card}>
        <div className={`${styles.animateIn} ${styles.delay1}`}>
          <StepIndicator currentStep={2} totalSteps={3} label="Skill assessment" />
        </div>
        <div className={`${styles.headingBlock} ${styles.animateIn} ${styles.delay2}`}>
          <h1 className={styles.heading}>No questions found</h1>
          <p className={styles.subheading}>
            Please upload your resume first — we generate these questions from it.
          </p>
        </div>
        <Link
          href="/upload-resume"
          className={`${styles.submitBtn} ${styles.animateIn} ${styles.delay3}`}
        >
          Go to upload resume
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.card}>
        <div className={`${styles.animateIn} ${styles.delay1}`}>
          <StepIndicator currentStep={2} totalSteps={3} label="Skill assessment" />
        </div>
        <div className={`${styles.loadingBlock} ${styles.animateIn} ${styles.delay2}`}>
          <span className={styles.loadingSpinner} aria-hidden="true" />
          <p className={styles.subheading}>Submitting your assessment…</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className={styles.card}>
        <div className={styles.animateIn}>
          <StepIndicator currentStep={2} totalSteps={3} label="Skill assessment" />
        </div>
        <div className={`${styles.headingBlock} ${styles.animateIn}`} style={{ animationDelay: "60ms" }}>
          <h1 className={styles.heading}>Assessment submitted</h1>
          <p className={styles.subheading}>
            Thanks — we&apos;ve recorded your skill ratings.
          </p>
        </div>
        <Link
          href="/evaluation-result"
          className={`${styles.submitBtn} ${styles.animateIn}`}
          style={{ animationDelay: "120ms" }}
        >
          View your results
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.animateIn}>
        <StepIndicator currentStep={2} totalSteps={3} label="Skill assessment" />
      </div>

      <div className={`${styles.headingBlock} ${styles.animateIn}`} style={{ animationDelay: "60ms" }}>
        <h1 className={styles.heading}>Rate your skills</h1>
        <p className={styles.subheading}>
          These questions came from your resume — select the option that honestly reflects your ability.
        </p>
      </div>

      <div className={styles.form}>
        {formError && (
          <p className={`${styles.formError} ${styles.animateIn}`} role="alert">
            <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V72a8,8,0,0,1,16,0v64a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z" />
            </svg>
            {formError}
          </p>
        )}

        <div className={styles.skillList}>
          {questions.map((q, index) => {
            const selected = answers[q.id] ?? null;
            return (
              <div
                key={q.id}
                className={`${styles.skillRow} ${selected ? styles.skillRowRated : ""} ${styles.animateIn}`}
                style={{ animationDelay: `${120 + index * 60}ms` }}
              >
                <p className={styles.skillName}>{q.question}</p>
                <SkillLevelGroup
                  questionId={q.id}
                  options={q.options}
                  selected={selected}
                  disabled={isLoading}
                  onSelect={(option) => handleSelect(q.id, option)}
                />
              </div>
            );
          })}
        </div>

        <div
          className={`${styles.animateIn}`}
          style={{ animationDelay: `${120 + questions.length * 60 + 60}ms` }}
        >
          <div className={styles.progressRow}>
            <span>
              {answeredCount} of {questions.length} rated
            </span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`${styles.submitBtn} ${styles.animateIn}`}
          style={{ animationDelay: `${120 + questions.length * 60 + 120}ms` }}
        >
          Submit assessment
        </button>
      </div>
    </div>
  );
}
