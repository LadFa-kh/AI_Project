// Resume upload API call. Endpoint confirmed against backend README
// (resume-controller):
// POST /resumes/upload  (multipart/form-data, field "file", PDF only, max 5MB)
// -> { resumeId, extractedSkills: string[], questions: { id, question, options: string[] }[] }
//
// userId is no longer sent — backend derives the user from the httpOnly
// accessToken cookie and has fully removed the old userId-based fallback.
// ต้อง login ก่อน (credentials: 'include' ด้านล่าง) ไม่งั้นได้ 403
//
// desiredRoleName is NOT accepted here anymore — it moved to
// POST /assessments/submit (see resume-session.ts for how it's carried over).

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export type ResumeUploadQuestion = {
  id: string;
  question: string;
  options: string[];
};

export type ResumeUploadResult = {
  resumeId: string;
  extractedSkills: string[];
  questions: ResumeUploadQuestion[];
};

export async function uploadResume(file: File): Promise<ResumeUploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    // NOTE: no Content-Type header here — the browser sets the multipart
    // boundary automatically. Unlike api-client's apiFetch, this endpoint
    // takes a multipart body, not a JSON body. credentials: 'include' is
    // still required so the accessToken cookie is sent.
    response = await fetch(`${API_BASE_URL}/resumes/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
  } catch {
    throw new Error("Network request failed. Check your connection and try again.");
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    const message =
      (body && typeof body === "object" && typeof (body as Record<string, unknown>).message === "string"
        ? ((body as Record<string, unknown>).message as string)
        : null) ?? `Upload failed with status ${response.status}.`;
    throw new Error(message);
  }

  return body as ResumeUploadResult;
}
