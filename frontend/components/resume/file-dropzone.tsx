"use client";

import { useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import { RESUME_ACCEPTED_EXTENSIONS } from "@/lib/validators";
import styles from "./resume-upload.module.css";

type FileDropzoneProps = {
  disabled?: boolean;
  hasError?: boolean;
  onFileSelected: (file: File) => void;
};

export function FileDropzone({ disabled, hasError, onFileSelected }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    e.target.value = "";
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!disabled && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      inputRef.current?.click();
    }
  }

  const classNames = [
    styles.dropzone,
    isDragOver ? styles.dropzoneActive : "",
    hasError ? styles.dropzoneError : "",
    disabled ? styles.dropzoneDisabled : "",
  ].filter(Boolean).join(" ");

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label="Upload your resume. Drag and drop a file, or press enter to browse."
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={handleKeyDown}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={classNames}
    >
      <div className={styles.dropzoneIcon}>
        <svg width="22" height="22" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
          <path d="M224,152v56a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V152a8,8,0,0,1,16,0v56H208V152a8,8,0,0,1,16,0ZM93.66,85.66,120,59.31V152a8,8,0,0,0,16,0V59.31l26.34,26.35a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,93.66,85.66Z" />
        </svg>
      </div>
      <p className={styles.dropzoneTitle}>Drag &amp; drop your resume, or click to browse</p>
      <p className={styles.dropzoneHint}>Accepted formats: {RESUME_ACCEPTED_EXTENSIONS.join(", ")} · Max 5MB</p>
      <input
        ref={inputRef}
        type="file"
        accept={RESUME_ACCEPTED_EXTENSIONS.join(",")}
        disabled={disabled}
        onChange={handleChange}
        className="sr-only"
        aria-label="Choose a resume file"
      />
    </div>
  );
}
