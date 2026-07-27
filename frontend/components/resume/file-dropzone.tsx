"use client";

import { useRef, type ChangeEvent, type DragEvent } from "react";
import { RESUME_ACCEPTED_EXTENSIONS } from "@/lib/validators";

type FileDropzoneProps = {
  disabled?: boolean;
  onFileSelected: (file: File) => void;
};

export function FileDropzone({ disabled, onFileSelected }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    e.target.value = "";
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 px-4 py-10 text-center cursor-pointer transition-colors hover:border-zinc-400 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 dark:border-zinc-700 dark:hover:border-zinc-600"
    >
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        รองรับ {RESUME_ACCEPTED_EXTENSIONS.join(", ")} ขนาดไม่เกิน 5MB
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={RESUME_ACCEPTED_EXTENSIONS.join(",")}
        disabled={disabled}
        onChange={handleChange}
        className="sr-only"
        aria-label="เลือกไฟล์เรซูเม่"
      />
    </div>
  );
}
