// Account settings / PDPA rights (API_CHANGES.md §5.9 B9).
// GET    /users/me/consents     consent history
// DELETE /users/me/consents     withdraw consent (→ needsConsent: true)
// GET    /users/me/data-export  JSON with profile, resumes, consents, usage
// DELETE /users/me              { password } or Google { confirm: email } → cookie cleared

import { apiFetch, unwrap } from "./api-client";

export type ConsentRecord = {
  id?: string;
  policyType?: string;
  version: string;
  acceptedAt?: string | null;
  withdrawnAt?: string | null;
  [key: string]: unknown;
};

// GET → data = { currentVersion, needsConsent, history: ConsentRecord[] } (confirmed รอบ 4 ข้อ 2.10).
// Still accepts a bare array in case the shape changes.
export async function listMyConsents(): Promise<ConsentRecord[]> {
  const data = unwrap<{ history?: ConsentRecord[] } | ConsentRecord[] | null>(
    await apiFetch<unknown>("/users/me/consents", { method: "GET" })
  );
  if (Array.isArray(data)) return data;
  return data?.history ?? [];
}

export async function withdrawConsent(): Promise<void> {
  await apiFetch<unknown>("/users/me/consents", { method: "DELETE" });
}

/** Fetches the export and saves it as a .json file in the browser. */
export async function downloadMyData(): Promise<void> {
  const res = await apiFetch<unknown>("/users/me/data-export", { method: "GET" });
  const data = unwrap<unknown>(res);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const a = document.createElement("a");
  a.href = url;
  a.download = `resumate-my-data-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function deleteMyAccount(confirmation: { password: string } | { confirm: string }): Promise<void> {
  await apiFetch<unknown>("/users/me", { method: "DELETE", body: JSON.stringify(confirmation) });
}
