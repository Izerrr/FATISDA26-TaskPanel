export type DueUrgency =
  | "none"
  | "onTrack"
  | "dueSoon"
  | "overdue";

export function getUrgency(
  dueDate: string | Date | null,
  status?: "TODO" | "IN_PROGRESS" | "NEED_REVIEW" | "DONE"
): DueUrgency {
  if (!dueDate) return "none";

  const due = new Date(dueDate).getTime();
  if (Number.isNaN(due)) return "none";

  if (status === "DONE") return "onTrack";

  const diff = due - Date.now();
  if (diff < 0) return "overdue";
  if (diff <= 48 * 60 * 60 * 1000) return "dueSoon";
  return "onTrack";
}

export function formatDueDate(
  dueDate: string | Date | null
): string {
  if (!dueDate) return "Tanpa deadline";

  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) {
    return "Tanggal tidak valid";
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const fmtDate = formatDueDate;
export const getDueUrgency = getUrgency;
