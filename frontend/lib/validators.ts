const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | null {
  if (!value.trim()) return "กรุณากรอกอีเมล";
  if (!EMAIL_RE.test(value)) return "รูปแบบอีเมลไม่ถูกต้อง";
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return "กรุณากรอกรหัสผ่าน";
  if (value.length < 8) return "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
  return null;
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string
): string | null {
  if (!confirmPassword) return "กรุณายืนยันรหัสผ่าน";
  if (password !== confirmPassword) return "รหัสผ่านไม่ตรงกัน";
  return null;
}

export function validateFullName(value: string): string | null {
  if (!value.trim()) return "กรุณากรอกชื่อ-นามสกุล";
  return null;
}

// Backend (resume-controller /resumes/upload) accepts PDF only, max 5MB.
export const RESUME_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const RESUME_ACCEPTED_EXTENSIONS = [".pdf"];
const RESUME_ACCEPTED_MIME_TYPES = ["application/pdf"];

export function validateResumeFile(file: File): string | null {
  const hasValidExtension = RESUME_ACCEPTED_EXTENSIONS.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  );
  const hasValidMimeType =
    file.type === "" || RESUME_ACCEPTED_MIME_TYPES.includes(file.type);

  if (!hasValidExtension || !hasValidMimeType) {
    return "รองรับเฉพาะไฟล์ .pdf เท่านั้น";
  }
  if (file.size > RESUME_MAX_SIZE_BYTES) {
    return "ขนาดไฟล์ต้องไม่เกิน 5MB";
  }
  return null;
}

// Guards against javascript:/data: URIs etc. in backend-supplied external
// links (e.g. internship posting URLs) rendered as <a href>. Returns null
// (safe to render as-is) for http(s) URLs, or a safe fallback ("#") for
// anything else so a malicious/malformed URL can never execute.
export function sanitizeExternalUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
    return null;
  } catch {
    return null;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
