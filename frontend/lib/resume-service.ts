// Resume upload API call. Endpoint confirmed against backend Swagger
// (resume-controller):
// POST /resumes/upload?userId={uuid}&desiredRoleName={string}  (multipart/form-data, field "file", PDF only, max 5MB)
// -> { resumeId, extractedSkills: string[], questions: { id, question, options: string[] }[] }

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

export async function uploadResume(
  userId: string,
  file: File,
  desiredRoleName?: string
): Promise<ResumeUploadResult> {
  // Always send desiredRoleName, even empty — backend's Swagger marks this
  // query param as required and 500s when it's omitted entirely.
  const params = new URLSearchParams({
    userId,
    desiredRoleName: desiredRoleName?.trim() ?? "",
  });

  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    // NOTE: no Content-Type header here — the browser sets the multipart
    // boundary automatically. Unlike api-client's apiFetch, this endpoint
    // takes query params + multipart body, not a JSON body.
    response = await fetch(`${API_BASE_URL}/resumes/upload?${params.toString()}`, {
      method: "POST",
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
