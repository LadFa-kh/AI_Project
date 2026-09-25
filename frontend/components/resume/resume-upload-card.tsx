"use client";

// Business logic (upload API call, file validation, error handling,
// session hand-off) is 100% unchanged from before this restructure — only
// the JSX layout changed, from a single glassmorphism .card wrapper to the
// demo's flat full-page sections (StepIndicator centered above the
// heading area owned by upload-resume-flow.tsx, dropzone/field/button as
// direct page sections). See upload-resume-flow.tsx for the page chrome
// (particle canvas, split heading) this renders inside of.

import Link from "next/link";
import { useEffect, useState } from "react";
import { StepIndicator } from "@/components/ui/step-indicator";
import { SkillAutocomplete } from "@/components/ui/skill-autocomplete";
import { ResumeDropzone } from "./resume-dropzone";
import { formatFileSize, validateResumeFile } from "@/lib/validators";
import { uploadResume } from "@/lib/resume-service";
import { writeResumeUploadResult } from "@/lib/resume-session";
import { useAuth } from "@/lib/auth-context";
import { describeError } from "@/lib/api-client";
import { isOutOfCredits, useCredits } from "@/lib/credit-service";
import { CreditsNotice } from "@/components/ui/credits-notice";
import styles from "./resume-upload.module.css";

type Status = "default" | "loading" | "error" | "success";

// Upload + skill extraction happens as a single API call with no real
// progress events from the backend, so these messages cycle on a timer
// rather than reflecting actual request stages — purely to reassure the
// user something is still happening during what can be a several-second
// wait (file upload + AI extraction).
const LOADING_MESSAGES = [
  "กำลังอัปโหลดเรซูเม่ของคุณ…",
  "กำลังตรวจสอบเรซูเม่ของคุณ…",
  "AI กำลังดึงข้อมูลทักษะจากเรซูเม่ของคุณ…",
];
const LOADING_MESSAGE_INTERVAL_MS = 2500;

export function ResumeUploadCard() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("default");
  const [formError, setFormError] = useState<string | null>(null);
  const [targetField, setTargetField] = useState("");
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const { credits, refresh: refreshCredits } = useCredits(!!user);
  const outOfCredits = isOutOfCredits(credits);
  const canSubmit = !!file && !fileError && !isLoading && !outOfCredits;

  useEffect(() => {
    if (!isLoading) {
      setLoadingMessageIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setLoadingMessageIndex((prev) => Math.min(prev + 1, LOADING_MESSAGES.length - 1));
    }, LOADING_MESSAGE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isLoading]);

  function handleFileSelected(selected: File) {
    const error = validateResumeFile(selected);
    setFileError(error);
    setFormError(null);
    setStatus("default");
    setFile(error ? null : selected);
  }

  function handleRemove() {
    setFile(null);
    setFileError(null);
    setFormError(null);
    setStatus("default");
  }

  async function handleSubmit() {
    if (!file || fileError) return;
    if (!user) {
      setStatus("error");
      setFormError("กรุณาเข้าสู่ระบบก่อนอัปโหลดเรซูเม่");
      return;
    }
    setStatus("loading");
    setFormError(null);
    try {
      const result = await uploadResume(file);
      writeResumeUploadResult({
        resumeId: result.resumeId,
        questions: result.questions,
        desiredRoleName: targetField.trim() || undefined,
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      // 429 CREDITS_EXHAUSTED / RATE_LIMITED get Thai copy from describeError (B8/B10).
      setFormError(describeError(err, "อัปโหลดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"));
      refreshCredits();
    }
  }

  // ===== Loading state — waiting for the API response =====
  if (isLoading) {
    return (
      <div className={styles.stateBlock}>
        <div className={`${styles.animateIn} ${styles.delay1}`}>
          <StepIndicator currentStep={1} totalSteps={3} label="อัปโหลดเรซูเม่" />
        </div>
        <div className={`${styles.loadingBlock} ${styles.animateIn} ${styles.delay2}`}>
          <span className={styles.loadingSpinner} aria-hidden="true" />
          <p className={styles.subheading} aria-live="polite">
            {LOADING_MESSAGES[loadingMessageIndex]}
          </p>
        </div>
      </div>
    );
  }

  // ===== Success state — resume uploaded, ready for the next step in the
  // flow (/skill-assessment) — this is the real "step -> step" progress the
  // user asked for: StepIndicator shows step 1 done, the CTA below is the
  // actual navigation into step 2. =====
  if (isSuccess) {
    return (
      <div className={styles.stateBlock}>
        <div className={`${styles.animateIn} ${styles.delay1}`}>
          <StepIndicator currentStep={2} totalSteps={3} label="อัปโหลดเรซูเม่สำเร็จ" />
        </div>
        <div className={`${styles.successBlock} ${styles.animateIn} ${styles.delay2}`}>
          <span className={styles.successIcon} aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 256 256" fill="currentColor">
              <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
            </svg>
          </span>
          <h1 className={styles.heading}>อัปโหลดเรซูเม่สำเร็จ</h1>
          <p className={styles.subheading}>
            เราได้รับเรซูเม่ของคุณและดึงข้อมูลทักษะเรียบร้อยแล้ว
          </p>
        </div>
        <Link
          href="/skill-assessment"
          className={`${styles.submitBtn} ${styles.animateIn} ${styles.delay3}`}
        >
          ไปทำแบบประเมินทักษะ
        </Link>
      </div>
    );
  }

  // ===== Default state — dropzone + optional field + submit =====
  return (
    <>
      <div className={`${styles.stepRow} ${styles.animateIn}`}>
        <StepIndicator currentStep={1} totalSteps={3} label="อัปโหลดเรซูเม่" />
      </div>

      {formError && (
        <p className={`${styles.formError} ${styles.animateIn}`} role="alert">
          <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V72a8,8,0,0,1,16,0v64a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z" />
          </svg>
          {formError}
        </p>
      )}

      <div className={`${styles.dropzoneWrap} ${styles.animateIn} ${styles.delay1}`}>
        {!file ? (
          <ResumeDropzone
            disabled={isLoading}
            hasError={!!fileError}
            onFileSelected={handleFileSelected}
          />
        ) : (
          <div className={styles.filePreview}>
            <span className={styles.fileIcon} aria-hidden="true">✓</span>
            <div className={styles.fileMeta}>
              <p className={styles.fileName}>{file.name}</p>
              <p className={styles.fileSize}>{formatFileSize(file.size)} — พร้อมอัปโหลด</p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isLoading}
              aria-label="ลบไฟล์"
              className={styles.removeBtn}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {fileError && (
        <p role="alert" className={`${styles.fieldError} ${styles.animateIn}`}>
          {fileError}
        </p>
      )}

      {!file && (
        <div className={`${styles.filetypes} ${styles.animateIn} ${styles.delay2}`}>
          <span className={styles.filetypeChip}>PDF</span>
          <span className={styles.filetypeChip}>สูงสุด 5MB</span>
        </div>
      )}

      <div className={`${styles.field} ${styles.animateIn} ${styles.delay3}`}>
        <label htmlFor="target-field" className={styles.fieldLabel}>
          สายงานที่สนใจฝึกงาน <span className={styles.fieldOptional}>(ถ้ามี)</span>
        </label>
        <SkillAutocomplete
          id="target-field"
          value={targetField}
          onChange={setTargetField}
          disabled={isLoading}
          placeholder="เช่น React.js, Data Analyst"
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`${styles.submitBtn} ${styles.animateIn} ${styles.delay4}`}
      >
        ดำเนินการต่อ
      </button>
      <CreditsNotice credits={credits} className={`${styles.animateIn} ${styles.delay4}`} />
    </>
  );
}
