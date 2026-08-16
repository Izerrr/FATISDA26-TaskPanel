import { getUrgency, fmtDate } from "@/lib/due-date";

interface Props {
  dueDate: string | null;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
}

export function DueBadge({ dueDate, status }: Props) {
  const u = getUrgency(dueDate, status);
  const label = fmtDate(dueDate);
  const styles = {
    none: "bg-black/[0.03] text-liquid-text-tertiary",
    normal: "bg-liquid-accent/10 text-liquid-accent",
    soon: "bg-liquid-warning/10 text-liquid-warning",
    late: "bg-liquid-danger/10 text-liquid-danger",
  };

  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[u]}`}>
      {label}
    </span>
  );
}
