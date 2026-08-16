export type Urgency = "none" | "normal" | "soon" | "late";

const SOON_MS = 1000 * 60 * 60 * 24 * 2;

export function getUrgency(
  dueDate: string | null,
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"
): Urgency {
  if (!dueDate || status === "DONE") return "normal";
  const due = new Date(dueDate).getTime();
  const now = Date.now();
  if (due < now) return "late";
  if (due - now <= SOON_MS) return "soon";
  return "normal";
}

export function fmtDate(d: string | null): string {
  if (!d) return "Tanpa tenggat";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}
