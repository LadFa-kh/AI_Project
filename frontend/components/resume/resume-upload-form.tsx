"use client";

import Link from "next/link";
import { useState } from "react";
import { FileDropzone } from "./file-dropzone";
import { formatFileSize, validateResumeFile } from "@/lib/validators";

type Status = "default" | "loading" | "error" | "success";

export function ResumeUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("default");
  const [formError, setFormError] = useState<string | null>(null);

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
      // TODO: wire to backend resume upload API (see PROJECT_CONTEXT.md contract: POST /resumes)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStatus("success");
    } catch {
      setStatus("error");
      setFormError("อัปโหลดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  }

  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const canSubmit = !!file && !fileError && !isLoading;

  if (isSuccess) {
    return (
      <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          อัปโหลดสำเร็จ
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          เราได้รับไฟล์เรซูเม่ของคุณแล้ว
        </p>
        <Link
          href="/skill-assessment"
          className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          ไปขั้นตอนประเมินทักษะ
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 text-center">
        อัปโหลดเรซูเม่
      </h1>
      <p className="mt-1 text-center text-sm text-zinc-600 dark:text-zinc-400">
        อัปโหลดไฟล์เรซูเม่เพื่อเริ่มขั้นตอนประเมินทักษะ
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {formError && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
          >
            {formError}
          </p>
        )}

        {!file ? (
          <FileDropzone disabled={isLoading} onFileSelected={handleFileSelected} />
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-300 px-4 py-3 dark:border-zinc-700">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {file.name}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatFileSize(file.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isLoading}
              className="shrink-0 text-sm font-medium text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
            >
              ลบไฟล์
            </button>
          </div>
        )}

        {fileError && (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            {fileError}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-2 h-11 w-full rounded-lg bg-zinc-900 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isLoading ? "กำลังอัปโหลด..." : "อัปโหลดเรซูเม่"}
        </button>
      </div>
    </div>
  );
}
