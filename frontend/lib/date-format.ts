/** "2026-10-01" or ISO datetime -> "1 ต.ค. 2569" (display only). */
export function formatThaiDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = iso.length <= 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export function formatThaiDateRange(start: string | null | undefined, end: string | null | undefined): string {
  if (!start && !end) return "—";
  return `${formatThaiDate(start) || "…"} – ${formatThaiDate(end) || "…"}`;
}
