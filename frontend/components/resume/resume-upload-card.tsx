"use client";

import Link from "next/link";
import { useState } from "react";
import { StepIndicator } from "@/components/ui/step-indicator";
import { ResumeDropzone } from "./resume-dropzone";
import { formatFileSize, validateResumeFile } from "@/lib/validators";
import nocturne from "@/components/ui/nocturne.module.css";
import styles from "./resume-upload.module.css";

type Status = "default" | "loading" | "error" | "success";

export function ResumeUploadCard() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("default");
  const [formError, setFormError] = useState<string | null>(null);

  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const canSubmit = !!file && !fileError && !isLoading;

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
    setStatus("loading");
    setFormError(null);
    try {
      // TODO: wire to backend — POST /resumes (multipart form-data, field "file")
      // -> { resumeId, extractedSkills: [{ skillName, source? }] } (see PROJECT_CONTEXT.md)
      await new Promise<void>((resolve, reject) =>
        setTimeout(() => reject(new Error("upload_failed")), 1200)
      );
      setStatus("success");
    } catch {
      setStatus("error");
      setFormError("Upload failed. Please try again.");
    }
  }

  if (isSuccess) {
    return (
      <div className={`${nocturne.card} ${nocturne.cardWide}`}>
        <StepIndicator currentStep={1} totalSteps={3} label="Upload resume" />
        <div className={styles.successBlock}>
          <span className={styles.successIcon} aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 256 256" fill="currentColor">
              <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
            </svg>
          </span>
          <h1 className={nocturne.heading}>Resume uploaded</h1>
          <p className={nocturne.subheading}>
            We&apos;ve received your resume and extracted your skills.
          </p>
        </div>
        <Link href="/skill-assessment" className={nocturne.submitBtn}>
          Continue to skill assessment
        </Link>
      </div>
    );
  }

  return (
    <div className={`${nocturne.card} ${nocturne.cardWide}`}>
      <StepIndicator currentStep={1} totalSteps={3} label="Upload resume" />

      <div className={nocturne.headingBlock}>
        <h1 className={nocturne.heading}>Upload your resume</h1>
        <p className={nocturne.subheading}>
          We&apos;ll use AI to extract your skills from your resume.
        </p>
      </div>

      <div className={nocturne.form}>
        {formError && (
          <p className={nocturne.formError} role="alert">
            <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V72a8,8,0,0,1,16,0v64a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z" />
            </svg>
            {formError}
          </p>
        )}

        {!file ? (
          <ResumeDropzone
            disabled={isLoading}
            hasError={!!fileError}
            onFileSelected={handleFileSelected}
          />
        ) : (
          <div className={styles.filePreview}>
            <span className={styles.fileIcon} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 256 256" fill="currentColor">
                <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z" />
              </svg>
            </span>
            <div className={styles.fileMeta}>
              <p className={styles.fileName}>{file.name}</p>
              <p className={styles.fileSize}>{formatFileSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isLoading}
              aria-label="Remove file"
              className={styles.removeBtn}
            >
              <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
              </svg>
            </button>
          </div>
        )}

        {fileError && (
          <p role="alert" className={nocturne.fieldError}>
            {fileError}
          </p>
        )}

        {isLoading && (
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: "70%" }} />
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={nocturne.submitBtn}
        >
          {isLoading && <span className={nocturne.spinner} aria-hidden="true" />}
          {isLoading ? "Uploading…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
